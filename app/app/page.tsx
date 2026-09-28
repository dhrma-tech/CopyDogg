import { redirect } from "next/navigation";
import { connection } from "next/server";
import { readStore } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import GenerationScreen from "./GenerationScreen";

export default async function AppScreen() {
  await connection(); // reads the data file, so render per request
  const { persona, contacts, templates, settings } = await readStore();

  if (!persona) {
    redirect("/onboarding");
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <GenerationScreen
          platforms={persona.platforms}
          contacts={contacts.map(({ id, name, relationship }) => ({ id, name, relationship }))}
          templates={templates.map(({ id, name }) => ({ id, name }))}
          voiceInput={settings.voiceInput}
        />
      </main>
    </>
  );
}
