export interface Sliders {
  formality: number;
  humor: number;
  bluntness: number;
  warmth: number;
  emojiDensity: number;
}

export const SLIDER_FIELDS: { key: keyof Sliders; label: string }[] = [
  { key: "formality", label: "Formality" },
  { key: "humor", label: "Humor" },
  { key: "bluntness", label: "Bluntness" },
  { key: "warmth", label: "Warmth" },
  { key: "emojiDensity", label: "Emoji density" },
];

function bucket(value: number, low: string, mid: string, high: string) {
  if (value < 34) return low;
  if (value < 67) return mid;
  return high;
}

export function previewSentence(s: Sliders) {
  const formality = bucket(s.formality, "loose and unfiltered", "conversational", "polished and buttoned-up");
  const humor = bucket(s.humor, "straight-faced", "a little playful", "genuinely funny");
  const bluntness = bucket(s.bluntness, "soft and diplomatic", "matter-of-fact", "no-nonsense direct");
  const warmth = bucket(s.warmth, "cool and detached", "friendly", "warm and personal");
  const emoji =
    s.emojiDensity < 10
      ? "practically no emoji"
      : s.emojiDensity < 40
        ? "the occasional emoji"
        : "emoji sprinkled throughout";

  return `Your posts will sound ${formality}, ${humor}, and ${warmth} — ${bluntness}, with ${emoji}.`;
}
