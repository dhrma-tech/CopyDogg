import { NextResponse } from "next/server";
import { streamPostVariations } from "@/lib/claude";
import { isPlatform } from "@/lib/platformRules";
import { isDemoMode, demoStream } from "@/lib/demoMode";
import { splitVariations } from "@/lib/variations";
import { addGeneration, getPersona, getRecentLikedOutputs } from "@/lib/store";

/**
 * Validation failures come back as plain JSON with a status code. Once the
 * request is valid, the response is NDJSON, one event per line:
 *   {"type":"delta","text":"..."}                       text as it's written
 *   {"type":"done","generationId":"...","outputs":[...]} saved, final split
 *   {"type":"error","error":"..."}                      failed mid-stream, nothing saved
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { platform, promptInput, toneOverride, variationCount } = body;

  const idea = typeof promptInput === "string" ? promptInput.trim().slice(0, 2000) : "";
  const override =
    typeof toneOverride === "string" && toneOverride.trim()
      ? toneOverride.trim().slice(0, 200)
      : null;
  const count =
    typeof variationCount === "number" && variationCount >= 1 && variationCount <= 3
      ? Math.floor(variationCount)
      : 3;

  if (!idea) {
    return NextResponse.json({ error: "Type an idea first." }, { status: 400 });
  }
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Unknown platform." }, { status: 400 });
  }

  const persona = await getPersona();
  if (!persona) {
    return NextResponse.json(
      { error: "Set up your voice first — it takes about five minutes." },
      { status: 409 }
    );
  }

  const recentLikedExamples = isDemoMode ? [] : await getRecentLikedOutputs(3);
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
          ? demoStream(count, request.signal)
          : streamPostVariations(
              {
                persona,
                platform,
                promptInput: idea,
                toneOverride: override,
                recentLikedExamples,
                variationCount: count,
              },
              request.signal
            );
        for await (const text of chunks) {
          raw += text;
          send({ type: "delta", text });
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
          await addGeneration({ platform, promptInput: idea, toneOverride: override, outputs })
        ).id;
      } catch {
        send({
          type: "error",
          error: "Wrote the posts but couldn't save them to the data file. Check the server log, then try again.",
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
