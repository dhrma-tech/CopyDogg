import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPersona } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import GenerationScreen from "./GenerationScreen";

export default async function AppScreen() {
  await connection(); // reads the data file, so render per request
  const persona = await getPersona();

  if (!persona) {
    redirect("/onboarding");
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <GenerationScreen personaName={persona.name} platforms={persona.platforms} />
      </main>
    </>
  );
}
