import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePostVariations } from "@/lib/claude";
import { PLATFORMS, type Platform } from "@/lib/platformRules";
import { isDevMode, MOCK_OUTPUTS } from "@/lib/devMode";

interface GenerateRequestBody {
  personaId: string;
  platform: Platform;
  promptInput: string;
  toneOverride?: string;
  variationCount?: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GenerateRequestBody>;
  const { personaId, platform, promptInput, toneOverride, variationCount } = body;
  const clampedVariationCount =
    variationCount && variationCount >= 1 && variationCount <= 3
      ? Math.floor(variationCount)
      : undefined;

  if (!personaId || !platform || !promptInput?.trim()) {
    return NextResponse.json(
      { error: "Missing persona, platform, or idea." },
      { status: 400 }
    );
  }

  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unknown platform." }, { status: 400 });
  }

  if (isDevMode) {
    return NextResponse.json({
      generationId: `dev-${Date.now()}`,
      outputs: MOCK_OUTPUTS.slice(0, clampedVariationCount ?? 3),
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select(
      "id, voice_description, tone_formality, tone_humor, tone_bluntness, tone_warmth, emoji_density, hashtag_tolerance, rules"
    )
    .eq("id", personaId)
    .single();

  if (personaError || !persona) {
    return NextResponse.json({ error: "Persona not found." }, { status: 404 });
  }

  const { data: likedGenerations } = await supabase
    .from("generations")
    .select("chosen_output, outputs")
    .eq("persona_id", personaId)
    .eq("feedback", 1)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentLikedExamples = (likedGenerations ?? []).map(
    (row) => row.chosen_output ?? row.outputs[0]
  );

  let outputs: string[];
  try {
    outputs = await generatePostVariations({
      persona: {
        voiceDescription: persona.voice_description,
        toneFormality: persona.tone_formality,
        toneHumor: persona.tone_humor,
        toneBluntness: persona.tone_bluntness,
        toneWarmth: persona.tone_warmth,
        emojiDensity: persona.emoji_density,
        hashtagTolerance: persona.hashtag_tolerance,
        rules: persona.rules,
      },
      platform,
      promptInput: promptInput.trim(),
      toneOverride: toneOverride?.trim() || null,
      recentLikedExamples,
      variationCount: clampedVariationCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Claude to generate posts. Try again." },
      { status: 502 }
    );
  }

  if (outputs.length === 0) {
    return NextResponse.json(
      { error: "That came back empty. Try again." },
      { status: 502 }
    );
  }

  const { data: generation, error: insertError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      persona_id: personaId,
      platform,
      prompt_input: promptInput.trim(),
      tone_override: toneOverride?.trim() || null,
      outputs,
    })
    .select("id, outputs")
    .single();

  if (insertError || !generation) {
    return NextResponse.json(
      { error: "Generated the posts but couldn't save them." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    generationId: generation.id,
    outputs: generation.outputs,
  });
}
