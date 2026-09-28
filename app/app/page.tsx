import { redirect } from "next/navigation";
import { connection } from "next/server";
import { activePersona, readStore } from "@/lib/store";
import GenerationScreen from "./GenerationScreen";

export default async function AppScreen() {
  await connection(); // reads the data file, so render per request
  const data = await readStore();
  const active = activePersona(data);

  if (!active) {
    redirect("/onboarding");
  }

  return (
    <main className="flex flex-1 justify-center px-6 pb-12">
      <GenerationScreen
        voices={data.personas.map(({ id, name, platforms }) => ({ id, name, platforms }))}
        initialVoiceId={active.id}
        contacts={data.contacts.map(({ id, name, relationship }) => ({ id, name, relationship }))}
        templates={data.templates.map(({ id, name }) => ({ id, name }))}
        voiceInput={data.settings.voiceInput}
      />
    </main>
  );
}
