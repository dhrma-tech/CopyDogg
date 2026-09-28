import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getActivePersona } from "@/lib/store";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  await connection(); // reads the data file, so render per request
  if (await getActivePersona()) {
    redirect("/app");
  }

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <OnboardingFlow />
    </main>
  );
}
