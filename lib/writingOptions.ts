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

/**
 * Everyday scenarios: who the message is for, with guidance for the prompt
 * and the formats that usually fit (picked automatically when available).
 */
export const SCENARIOS = {
  landlord: {
    label: "landlord",
    guidance:
      "A message to their landlord or property manager. Clear and polite but firm: what the problem is, since when, and what they need done by when.",
    formats: ["text", "email"],
  },
  doctor: {
    label: "doctor's office",
    guidance:
      "A message to a doctor's office or clinic. Brief and clear: who they are, what they need (appointment, refill, results), and when they're available. No medical advice.",
    formats: ["email", "text"],
  },
  school: {
    label: "school",
    guidance:
      "A message to a teacher or school staff, usually about their child. Warm, respectful and specific, with one clear ask.",
    formats: ["email", "text"],
  },
  job: {
    label: "job application",
    guidance:
      'A message about a job: an application, a recruiter, or a follow-up after an interview. Confident and specific, not stiff. No clichés like "I am writing to express my interest".',
    formats: ["email", "linkedin"],
  },
  refund: {
    label: "refund request",
    guidance:
      "Asking a company for a refund or a fix. Polite and factual: the order or account details, what went wrong, and exactly what outcome they want.",
    formats: ["email"],
  },
  cancel: {
    label: "cancel a subscription",
    guidance:
      "Cancelling a subscription or service. Short and unambiguous, and asks for written confirmation of the cancellation.",
    formats: ["email"],
  },
} as const satisfies Record<string, { label: string; guidance: string; formats: readonly string[] }>;

export type ScenarioKey = keyof typeof SCENARIOS;
export const SCENARIO_KEYS = Object.keys(SCENARIOS) as ScenarioKey[];
