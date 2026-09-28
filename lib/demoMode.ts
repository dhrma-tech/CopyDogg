import type { Platform } from "./platformRules";
import type { ExtractedVoice } from "./claude";

/**
 * Demo mode: no ANTHROPIC_API_KEY set. The app still runs and saves data for
 * real — only the Claude calls are replaced with placeholders, so you can
 * click around before adding a key. Server-side only.
 */
export const isDemoMode = !process.env.ANTHROPIC_API_KEY;

export const DEMO_OUTPUTS = [
  "This is a placeholder post. Add ANTHROPIC_API_KEY to .env.local to get real ones.",
  "Placeholder #2 — demo mode, no Claude call was made.",
  "Placeholder #3, written by nobody in particular. Still demo mode.",
];

export function demoExtractedVoice(platforms: Platform[]): ExtractedVoice {
  return {
    voiceDescription:
      "Demo mode placeholder: with an API key, Claude writes a paragraph here describing how you sound — rhythm, quirks, what you avoid.",
    tone: {
      formality: 30,
      humor: 65,
      bluntness: 70,
      warmth: 55,
      emojiDensity: 10,
      hashtagTolerance: 5,
    },
    platformVoices: Object.fromEntries(
      platforms.map((p) => [p, "Demo mode placeholder: how you sound on this platform."])
    ),
  };
}

/** Demo stand-in for streamPostVariations: same text shape, arriving in chunks. */
export async function* demoStream(count: number, signal?: AbortSignal): AsyncGenerator<string> {
  const text = DEMO_OUTPUTS.slice(0, count).join("\n---\n");
  const words = text.split(/(?<= )/);
  // Pause like real thinking time, so the loading placeholders are visible.
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (let i = 0; i < words.length; i += 3) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
    yield words.slice(i, i + 3).join("");
  }
}
