import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode, MOCK_PERSONA_FULL, MOCK_TOPICS } from "@/lib/devMode";
import AppHeader from "@/components/AppHeader";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  if (isDevMode) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-1 justify-center px-6 pb-12">
          <ProfileForm persona={MOCK_PERSONA_FULL} initialTopics={MOCK_TOPICS} />
        </main>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: persona } = await supabase
    .from("personas")
    .select(
      "id, voice_description, tone_formality, tone_humor, tone_bluntness, tone_warmth, emoji_density, rules"
    )
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!persona) {
    redirect("/onboarding");
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("id, label")
    .eq("user_id", user!.id);

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <ProfileForm
          persona={{
            id: persona.id,
            voiceDescription: persona.voice_description,
            toneFormality: persona.tone_formality,
            toneHumor: persona.tone_humor,
            toneBluntness: persona.tone_bluntness,
            toneWarmth: persona.tone_warmth,
            emojiDensity: persona.emoji_density,
            rules: persona.rules,
          }}
          initialTopics={topics ?? []}
        />
      </main>
    </>
  );
}
