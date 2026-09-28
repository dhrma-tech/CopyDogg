import { NextResponse } from "next/server";
import { streamPostVariations } from "@/lib/claude";
import { isPlatform, platformRules, type Structure } from "@/lib/platformRules";
import { isDemoMode, demoStream } from "@/lib/demoMode";
import { splitVariations } from "@/lib/variations";
import {
  LANGUAGES,
  SCENARIOS,
  SCENARIO_KEYS,
  SITUATIONS,
  TWEAKS,
  isOneOf,
  type GenerateMode,
} from "@/lib/writingOptions";
import { activePersona, addGeneration, getRecentLikedOutputs, readStore } from "@/lib/store";

const GENERATE_MODES: readonly GenerateMode[] = ["write", "reply", "rewrite", "tweak"];

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Validation failures come back as plain JSON with a status code. Once the
 * request is valid, the response is NDJSON, one event per line:
 *   {"type":"delta","text":"..."}                       text as it's written
 *   {"type":"done","generationId":"...","outputs":[...]} saved, final split
 *   {"type":"error","error":"..."}                      failed mid-stream, nothing saved
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const mode: GenerateMode = isOneOf(GENERATE_MODES, body.mode) ? body.mode : "write";
  const platform = body.platform;
  const idea = text(body.promptInput, 2000);
  const context = text(body.context, 8000);
  const override = text(body.toneOverride, 200) || null;
  const situation = isOneOf(SITUATIONS, body.situation) ? body.situation : null;
  const scenario = isOneOf(SCENARIO_KEYS, body.scenario) ? SCENARIOS[body.scenario].guidance : null;
  const conversation = mode === "reply" && body.conversation === true;
  const language = isOneOf(LANGUAGES, body.language) ? body.language : null;
  const tweak = isOneOf(TWEAKS, body.tweak) ? body.tweak : null;

  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Unknown platform." }, { status: 400 });
  }
  if (mode === "write" && !idea) {
    return NextResponse.json({ error: "Type an idea first." }, { status: 400 });
  }
  if (mode === "reply" && !context) {
    return NextResponse.json({ error: "Paste the message you're replying to." }, { status: 400 });
  }
  if (mode === "rewrite" && !context) {
    return NextResponse.json({ error: "Paste the draft you want rewritten." }, { status: 400 });
  }
  if (mode === "tweak" && (!context || !tweak)) {
    return NextResponse.json({ error: "Nothing to tweak." }, { status: 400 });
  }

  const data = await readStore();
  const { contacts, templates } = data;
  // The voice picked on /app; falls back to the active one.
  const persona = data.personas.find((p) => p.id === body.personaId) ?? activePersona(data);
  if (!persona) {
    return NextResponse.json(
      { error: "Set up your voice first — it takes about five minutes." },
      { status: 409 }
    );
  }

  const structure: Structure | null =
    body.structure && platformRules[platform].structure === body.structure
      ? platformRules[platform].structure!
      : null;
  const contact = contacts.find((c) => c.id === body.contactId) ?? null;
  const template = templates.find((t) => t.id === body.templateId) ?? null;

  const requested =
    typeof body.variationCount === "number" && body.variationCount >= 1 && body.variationCount <= 3
      ? Math.floor(body.variationCount)
      : structure
        ? 2 // threads and carousels are long; two options is plenty
        : 3;
  const count = mode === "tweak" ? 1 : requested;

  const recentLikedExamples = isDemoMode ? [] : await getRecentLikedOutputs(persona.id, 3);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Both throw once the browser has disconnected; there's no one to tell then.
      const send = (event: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {}
      };
      const close = () => {
        try {
          controller.close();
        } catch {}
      };

      let raw = "";
      try {
        const chunks = isDemoMode
          ? demoStream(mode, count, request.signal)
          : streamPostVariations(
              {
                persona,
                platform,
                mode,
                promptInput: idea,
                context,
                situation,
                scenario,
                conversation,
                toneOverride: override,
                contact,
                language,
                structure,
                template,
                tweak,
                recentLikedExamples,
                variationCount: count,
              },
              request.signal
            );
        for await (const chunk of chunks) {
          raw += chunk;
          send({ type: "delta", text: chunk });
        }
      } catch {
        // A closed tab or a newer request aborted this one: nobody is listening.
        if (request.signal.aborted) return close();
        send({
          type: "error",
          error: "Couldn't reach Claude. Check your API key and connection, then try again.",
        });
        return close();
      }

      if (request.signal.aborted) return close();

      const outputs = splitVariations(raw);
      if (outputs.length === 0) {
        send({ type: "error", error: "That came back empty. Try again." });
        return close();
      }

      let generationId: string;
      try {
        generationId = (
          await addGeneration({
            personaId: persona.id,
            platform,
            mode,
            promptInput: idea,
            context: context || null,
            toneOverride: override,
            outputs,
          })
        ).id;
      } catch {
        send({
          type: "error",
          error: "Wrote it but couldn't save it to the data file. Check the server log, then try again.",
        });
        return close();
      }
      send({ type: "done", generationId, outputs });
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
