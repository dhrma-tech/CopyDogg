import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode } from "@/lib/devMode";
import AppHeader from "@/components/AppHeader";
import LibraryList from "./LibraryList";

export default async function LibraryPage() {
  if (isDevMode) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-1 justify-center px-6 pb-12">
          <LibraryList generations={[]} />
        </main>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: generations } = await supabase
    .from("generations")
    .select("id, platform, prompt_input, outputs, chosen_output, created_at")
    .eq("user_id", user!.id)
    .eq("saved", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <LibraryList generations={generations ?? []} />
      </main>
    </>
  );
}
