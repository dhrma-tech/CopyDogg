/**
 * Choices shown on /app beyond platform. Shared by the UI and the API route,
 * so both validate against the same lists. No server-only imports.
 */

export const MODES = ["write", "reply", "rewrite", "check"] as const;
export type Mode = (typeof MODES)[number];

/** Modes that produce text (everything but "check"), plus the per-card tweak. */
export type GenerateMode = Exclude<Mode, "check"> | "tweak";

export const MODE_LABELS: Record<Mode, string> = {
  write: "Write",
  reply: "Reply",
  rewrite: "Rewrite",
  check: "Check",
};

/** Everyday situations: one tap sets the intent. */
export const SITUATIONS = [
  "say no nicely",
  "follow up",
  "apologize",
  "say thanks",
  "ask a favor",
  "decline an invite",
  "give feedback",
  "set a boundary",
] as const;

export const RELATIONSHIPS = [
  "boss",
  "coworker",
  "client",
  "friend",
  "family",
  "partner",
  "other",
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Chinese",
  "Arabic",
] as const;

/** One-tap edits on a finished card. */
export const TWEAKS = ["shorter", "warmer", "more direct", "funnier"] as const;
export type Tweak = (typeof TWEAKS)[number];

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** Retune needs at least this many liked or hand-edited posts to learn from. */
export const MIN_LEARNABLE_POSTS = 3;
