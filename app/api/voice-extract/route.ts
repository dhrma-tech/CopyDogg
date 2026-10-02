import { NextResponse } from "next/server";
import { extractVoiceProfile, type PlatformSamples } from "@/lib/claude";
import { aiErrorMessage } from "@/lib/llm";
import { isPlatform } from "@/lib/platformRules";
import { isDemoMode, demoExtractedVoice } from "@/lib/demoMode";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rateLimit";

const MAX_CHARS_PER_ENTRY = 4000;

/** Keeps only known platforms and non-empty, length-capped text. */
function cleanInput(raw: unknown): PlatformSamples[] {
  if (!Array.isArray(raw)) return [];
  const clip = (v: unknown) =>
    typeof v === "string" ? v.trim().slice(0, MAX_CHARS_PER_ENTRY) : "";

  return raw.flatMap((entry) => {
    if (!entry || !isPlatform(entry.platform)) return [];
    const samples = Array.isArray(entry.samples)
      ? entry.samples.map(clip).filter(Boolean).slice(0, 3)
      : [];
    const rewrite = clip(entry.rewrite);
    if (samples.length === 0 && !rewrite) return [];
    return [{ platform: entry.platform, samples, rewrite }];
  });
}

export async function POST(request: Request) {
  if (!checkRateLimit(`voice-extract:${clientIpFromRequest(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Slow down a bit — try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { platforms?: unknown };
  const input = cleanInput(body.platforms);

  if (input.length === 0) {
    return NextResponse.json(
      { error: "Write or paste something for at least one platform first." },
      { status: 400 }
    );
  }

  if (isDemoMode) {
    return NextResponse.json(demoExtractedVoice(input.map((i) => i.platform)));
  }

  let result;
  try {
    result = await extractVoiceProfile(input);
  } catch (err) {
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }

  if (!result || !result.voiceDescription) {
    return NextResponse.json(
      { error: "Couldn't make sense of that. Try again, or continue with defaults." },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
