import { NextResponse } from "next/server";
import { extractVoiceProfile, type PlatformSamples } from "@/lib/claude";
import { aiErrorMessage } from "@/lib/llm";
import { isDemoMode, demoExtractedVoice } from "@/lib/demoMode";
import { activePersona, generationBelongsTo, readStore } from "@/lib/store";
import type { Platform } from "@/lib/platformRules";
import { MIN_LEARNABLE_POSTS as MIN_LEARNABLE } from "@/lib/writingOptions";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rateLimit";

const MAX_PER_PLATFORM = 5;

/**
 * Proposes an updated voice profile from posts the user liked or edited by
 * hand, starting from their current profile. Nothing is saved here — the
 * profile page shows the proposal and saves it if they keep it.
 */
export async function POST(request: Request) {
  if (!checkRateLimit(`voice-retune:${clientIpFromRequest(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Slow down a bit — try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { personaId?: unknown };
  const data = await readStore();
  const persona = data.personas.find((p) => p.id === body.personaId) ?? activePersona(data);
  if (!persona) {
    return NextResponse.json({ error: "Set up your voice first." }, { status: 409 });
  }

  // Only this voice's liked or edited posts.
  const learnable = data.generations.filter(
    (g) =>
      (g.feedback === 1 || g.edited) && g.chosenOutput && generationBelongsTo(g, persona.id, data)
  );
  if (learnable.length < MIN_LEARNABLE) {
    return NextResponse.json(
      {
        error: `Like or edit at least ${MIN_LEARNABLE} posts first — that's what CopyDogg learns from. So far: ${learnable.length}.`,
      },
      { status: 400 }
    );
  }

  // Newest first, a few per platform, edits before likes (stronger signal).
  const byPlatform = new Map<Platform, string[]>();
  for (const g of [...learnable].reverse().sort((a, b) => Number(!!b.edited) - Number(!!a.edited))) {
    const list = byPlatform.get(g.platform) ?? [];
    if (list.length < MAX_PER_PLATFORM) list.push(g.chosenOutput!);
    byPlatform.set(g.platform, list);
  }
  const input: PlatformSamples[] = [...byPlatform].map(([platform, samples]) => ({
    platform,
    samples,
    rewrite: "",
  }));

  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json(demoExtractedVoice(persona.platforms));
  }

  try {
    const result = await extractVoiceProfile(input, {
      voiceDescription: persona.voiceDescription,
      platformVoices: persona.platformVoices,
    });
    if (!result || !result.voiceDescription) {
      return NextResponse.json({ error: "Couldn't make sense of that. Try again." }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }
}
