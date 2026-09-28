import Anthropic from "@anthropic-ai/sdk";
import {
  PLATFORMS,
  isPlatform,
  onboardingPrompts,
  platformRules,
  type Platform,
} from "./platformRules";

// Falls back to a placeholder key so the client can construct in demo mode
// (see lib/demoMode.ts), where this client is never actually called.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "demo-mode-placeholder",
});

export interface PersonaForPrompt {
  voiceDescription: string | null;
  toneFormality: number;
  toneHumor: number;
  toneBluntness: number;
  toneWarmth: number;
  emojiDensity: number;
  hashtagTolerance: number;
  rules: string[];
  /** Short per-platform voice notes from onboarding, e.g. { x: "drier, shorter" }. */
  platformVoices: Partial<Record<Platform, string>>;
}

export interface GenerateVariationsParams {
  persona: PersonaForPrompt;
  platform: Platform;
  promptInput: string;
  toneOverride?: string | null;
  recentLikedExamples?: string[];
  variationCount?: number;
}

function buildSystemPrompt({
  persona,
  platform,
  promptInput,
  toneOverride,
  recentLikedExamples,
  variationCount,
}: GenerateVariationsParams): string {
  const rule = platformRules[platform];

  const rulesBlock =
    persona.rules.length > 0
      ? persona.rules.join("\n")
      : "(no hard rules set)";

  const likedBlock =
    recentLikedExamples && recentLikedExamples.length > 0
      ? recentLikedExamples.join("\n---\n")
      : "(none yet)";

  return `You are writing a social media post as this specific person. Never sound like a generic AI assistant.

VOICE:
${persona.voiceDescription ?? "(no voice description set yet — write in a plain, direct, human tone)"}

TONE DIALS (0-100): formality ${persona.toneFormality}, humor ${persona.toneHumor}, bluntness ${persona.toneBluntness}, warmth ${persona.toneWarmth}, emoji density ${persona.emojiDensity}, hashtag tolerance ${persona.hashtagTolerance}

HARD RULES (never break these):
${rulesBlock}

PLATFORM: ${rule.label}
${rule.formatNotes}${rule.charLimit ? ` Stay under ${rule.charLimit} characters.` : ""}
${persona.platformVoices[platform] ? `\nHOW THEY SOUND ON ${rule.label.toUpperCase()} SPECIFICALLY:\n${persona.platformVoices[platform]}\n` : ""}
RECENT LIKED EXAMPLES (match this energy, don't copy):
${likedBlock}

TASK: Write ${variationCount ?? 3} distinct variations of a post about: "${promptInput}"
${toneOverride ? `For this post specifically: ${toneOverride}` : ""}

Return ONLY the post text for each variation, separated by "---". No preamble, no explanation.`;
}

/**
 * Short posts don't need deep thinking, and thinking time is most of the wait
 * before the first word. Raise to "medium" if output quality drops.
 */
export const GENERATION_EFFORT = "low" as const;

/**
 * Streams the raw response text as it's written. Variations are separated by
 * "---"; split them with lib/variations.ts. Aborting `signal` cancels the call.
 */
export async function* streamPostVariations(
  params: GenerateVariationsParams,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const stream = client.messages.stream(
    {
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: { effort: GENERATION_EFFORT },
      system: buildSystemPrompt(params),
      messages: [{ role: "user", content: "Generate the variations now." }],
    },
    { signal }
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

// ---------------------------------------------------------------------------
// Onboarding: read a user's samples and rewrites, draft their voice profile.
// ---------------------------------------------------------------------------

export interface PlatformSamples {
  platform: Platform;
  samples: string[];
  rewrite: string;
}

export interface ExtractedVoice {
  voiceDescription: string;
  tone: {
    formality: number;
    humor: number;
    bluntness: number;
    warmth: number;
    emojiDensity: number;
    hashtagTolerance: number;
  };
  platformVoices: Partial<Record<Platform, string>>;
}

const TONE_KEYS = [
  "formality",
  "humor",
  "bluntness",
  "warmth",
  "emoji_density",
  "hashtag_tolerance",
] as const;

const VOICE_SCHEMA = {
  type: "object",
  properties: {
    voice_description: { type: "string" },
    tone: {
      type: "object",
      properties: Object.fromEntries(TONE_KEYS.map((k) => [k, { type: "integer" }])),
      required: [...TONE_KEYS],
      additionalProperties: false,
    },
    platform_notes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: [...PLATFORMS] },
          note: { type: "string" },
        },
        required: ["platform", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["voice_description", "tone", "platform_notes"],
  additionalProperties: false,
};

const VOICE_SYSTEM_PROMPT = `You analyze how one person writes so a ghostwriting tool can sound like them.

For each platform you get some things they've actually posted, plus their rewrite of a deliberately bland post. The rewrite is the strongest signal: what they changed, cut, and added shows their voice.

Return:
- voice_description: one tight paragraph (3-5 sentences) addressed to them ("You write in short punchy lines..."). Cover tone, sentence rhythm, quirks, and what they avoid. Be specific to their writing, not generic.
- tone: 0-100 for formality, humor, bluntness, warmth, emoji_density, hashtag_tolerance, judged from the writing.
- platform_notes: for each platform provided, one or two sentences on how they sound there specifically compared to their overall voice. Only include platforms you were given.`;

function clampTone(value: unknown): number {
  const n = typeof value === "number" ? value : 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function extractVoiceProfile(
  input: PlatformSamples[]
): Promise<ExtractedVoice | null> {
  const userContent = input
    .map(({ platform, samples, rewrite }) => {
      const label = platformRules[platform].label;
      const lines = [`## ${label}`];
      if (samples.length > 0) {
        lines.push(
          `Things they've posted:\n${samples.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        );
      }
      if (rewrite) {
        lines.push(
          `Bland post: ${onboardingPrompts[platform].blandPost}\nTheir rewrite: ${rewrite}`
        );
      }
      return lines.join("\n\n");
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: VOICE_SCHEMA },
    },
    system: VOICE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  if (response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  let parsed: {
    voice_description?: string;
    tone?: Record<string, unknown>;
    platform_notes?: { platform: unknown; note: unknown }[];
  };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    return null;
  }

  const provided = new Set(input.map((i) => i.platform));
  const platformVoices: Partial<Record<Platform, string>> = {};
  for (const { platform, note } of parsed.platform_notes ?? []) {
    if (isPlatform(platform) && provided.has(platform) && typeof note === "string") {
      platformVoices[platform] = note.trim();
    }
  }

  const tone = parsed.tone ?? {};
  return {
    voiceDescription: (parsed.voice_description ?? "").trim(),
    tone: {
      formality: clampTone(tone.formality),
      humor: clampTone(tone.humor),
      bluntness: clampTone(tone.bluntness),
      warmth: clampTone(tone.warmth),
      emojiDensity: clampTone(tone.emoji_density),
      hashtagTolerance: clampTone(tone.hashtag_tolerance),
    },
    platformVoices,
  };
}
