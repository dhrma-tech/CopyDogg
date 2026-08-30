import Anthropic from "@anthropic-ai/sdk";
import { platformRules, type Platform } from "./platformRules";

// Falls back to a placeholder key so the client can construct in test mode
// (see lib/devMode.ts), where this client is never actually called.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dev-mode-placeholder",
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

RECENT LIKED EXAMPLES (match this energy, don't copy):
${likedBlock}

TASK: Write ${variationCount ?? 3} distinct variations of a post about: "${promptInput}"
${toneOverride ? `For this post specifically: ${toneOverride}` : ""}

Return ONLY the post text for each variation, separated by "---". No preamble, no explanation.`;
}

export async function generatePostVariations(
  params: GenerateVariationsParams
): Promise<string[]> {
  const system = buildSystemPrompt(params);

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    output_config: { effort: "medium" },
    system,
    messages: [
      {
        role: "user",
        content: "Generate the variations now.",
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  return raw
    .split("---")
    .map((variation) => variation.trim())
    .filter(Boolean);
}
