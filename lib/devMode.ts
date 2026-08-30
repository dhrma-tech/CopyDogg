/**
 * Test mode for local UI testing without real Supabase/Anthropic credentials.
 * Auto-enables when NEXT_PUBLIC_SUPABASE_URL is unset and auto-disables the
 * moment real env vars are added — nothing to remember to turn off.
 */
export const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const MOCK_PERSONA_ID = "dev-persona";
export const MOCK_PERSONA_NAME = "Default (test mode)";

export const MOCK_VOICE_DESCRIPTION =
  "You write in short, direct lines with a dry sense of humor. You rarely use emoji and prefer concrete examples over abstractions.";

export const MOCK_OUTPUTS = [
  "This is a placeholder post — test mode, no real Claude call was made.",
  "Placeholder #2. Add real Supabase + Anthropic keys to .env.local to see actual generations.",
  "Placeholder #3, written by nobody in particular. Still test mode.",
];

export const MOCK_PERSONA_FULL = {
  id: MOCK_PERSONA_ID,
  voiceDescription: MOCK_VOICE_DESCRIPTION,
  toneFormality: 50,
  toneHumor: 50,
  toneBluntness: 50,
  toneWarmth: 50,
  emojiDensity: 20,
  rules: ["keep sentences short", "no emoji unless it's 🔥"],
};

export const MOCK_TOPICS = [
  { id: "dev-topic-1", label: "indie hacking" },
  { id: "dev-topic-2", label: "building in public" },
];

export const MOCK_EMAIL = "you@example.com";
export const MOCK_DISPLAY_NAME = "";
export const MOCK_GENERATION_COUNT = 3;
