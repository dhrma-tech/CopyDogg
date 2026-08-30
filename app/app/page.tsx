import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode, MOCK_PERSONA_ID, MOCK_PERSONA_NAME } from "@/lib/devMode";
import AppHeader from "@/components/AppHeader";
import GenerationScreen from "./GenerationScreen";

export default async function AppScreen() {
  if (isDevMode) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-1 justify-center px-6 pb-12">
          <GenerationScreen
            personaId={MOCK_PERSONA_ID}
            personaName={MOCK_PERSONA_NAME}
          />
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
    .select("id, name")
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!persona) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-semibold text-ink">
              No voice profile yet
            </h1>
            <p className="mt-3 text-sm text-ink-soft">
              Set one up first — it only takes a few minutes.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-sm font-bold text-card"
            >
              Set up your voice
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <GenerationScreen personaId={persona.id} personaName={persona.name} />
      </main>
    </>
  );
}
