import type { Platform } from "./platformRules";
import type { ExtractedVoice } from "./claude";
import type { GenerateMode } from "./writingOptions";
import { provider } from "./llm";

/**
 * Demo mode: no ANTHROPIC_API_KEY or GEMINI_API_KEY set. The app still runs and saves
 * data for real — only the AI calls are replaced with placeholders, so you can
 * click around before adding a key. Server-side only.
 */
export const isDemoMode = !provider;

export const DEMO_OUTPUTS = [
  "This is a placeholder post. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to .env.local to get real ones.",
  "Placeholder #2 — demo mode, no AI call was made.",
  "Placeholder #3, written by nobody in particular. Still demo mode.",
];

export function demoExtractedVoice(platforms: Platform[]): ExtractedVoice {
  return {
    voiceDescription:
      "Demo mode placeholder: with an API key, the AI writes a paragraph here describing how you sound — rhythm, quirks, what you avoid.",
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

const DEMO_BY_MODE: Record<GenerateMode, string[]> = {
  write: DEMO_OUTPUTS,
  reply: [
    "Placeholder reply #1 — with an API key, this answers the message in your voice.",
    "Placeholder reply #2, a bit warmer. Demo mode.",
    "Placeholder reply #3, short and direct. Demo mode.",
  ],
  rewrite: [
    "Placeholder rewrite #1 — your draft, tightened, in your voice.",
    "Placeholder rewrite #2, a different angle. Demo mode.",
    "Placeholder rewrite #3. Demo mode.",
  ],
  notes: [
    "Summary: demo mode placeholder. With an API key, this turns your notes into a short summary.\n\nDecisions:\n- Placeholder decision\n\nNext steps:\n- Placeholder next step",
  ],
  tweak: ["Placeholder tweak — the same post, adjusted as asked. Demo mode."],
};

/** Demo stand-in for streamPostVariations: same text shape, arriving in chunks. */
export async function* demoStream(
  mode: GenerateMode,
  count: number,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const text = DEMO_BY_MODE[mode].slice(0, count).join("\n---\n");
  const words = text.split(/(?<= )/);
  // Pause like real thinking time, so the loading placeholders are visible.
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (let i = 0; i < words.length; i += 3) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
    yield words.slice(i, i + 3).join("");
  }
}

export const DEMO_TONE_CHECK = {
  verdict: "Demo mode: with an API key, this says in one sentence how your message will land.",
  traits: [
    { label: "clear", level: "high" as const },
    { label: "formal", level: "medium" as const },
    { label: "warm", level: "low" as const },
  ],
  suggestions: ["Demo mode placeholder: a specific fix would go here."],
};
