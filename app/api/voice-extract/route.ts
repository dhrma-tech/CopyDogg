import { NextResponse } from "next/server";
import { extractVoiceProfile, type PlatformSamples } from "@/lib/claude";
import { isPlatform } from "@/lib/platformRules";
import { isDemoMode, demoExtractedVoice } from "@/lib/demoMode";

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
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Claude. Check your API key and connection, then try again." },
      { status: 502 }
    );
  }

  if (!result || !result.voiceDescription) {
    return NextResponse.json(
      { error: "Couldn't make sense of that. Try again, or continue with defaults." },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
