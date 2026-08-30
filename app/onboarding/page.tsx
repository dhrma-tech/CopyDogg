import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode } from "@/lib/devMode";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  if (isDevMode) {
    return (
      <main className="flex flex-1 justify-center px-6 py-12">
        <OnboardingFlow />
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existingPersona } = await supabase
    .from("personas")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .maybeSingle();

  if (existingPersona) {
    redirect("/app");
  }

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <OnboardingFlow />
    </main>
  );
}
