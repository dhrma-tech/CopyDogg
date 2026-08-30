import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isDevMode,
  MOCK_EMAIL,
  MOCK_DISPLAY_NAME,
  MOCK_GENERATION_COUNT,
} from "@/lib/devMode";
import AppHeader from "@/components/AppHeader";
import SettingsPanel from "./SettingsPanel";

export default async function SettingsPage() {
  if (isDevMode) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-1 justify-center px-6 pb-12">
          <SettingsPanel
            email={MOCK_EMAIL}
            initialDisplayName={MOCK_DISPLAY_NAME}
            generationCount={MOCK_GENERATION_COUNT}
          />
        </main>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ensure a profiles row exists — nothing creates one at signup today.
  await supabase
    .from("profiles")
    .upsert({ id: user!.id }, { onConflict: "id", ignoreDuplicates: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  const { count } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <SettingsPanel
          email={user!.email ?? ""}
          initialDisplayName={profile?.display_name ?? ""}
          generationCount={count ?? 0}
        />
      </main>
    </>
  );
}
