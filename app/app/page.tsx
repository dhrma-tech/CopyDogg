import { redirect } from "next/navigation";
import { connection } from "next/server";
import { activePersona, readStore } from "@/lib/store";
import { MODES, isOneOf } from "@/lib/writingOptions";
import GenerationScreen from "./GenerationScreen";

export default async function AppScreen({ searchParams }: PageProps<"/app">) {
  await connection(); // reads the data file, so render per request
  // /app?mode=reply opens in that mode (the landing page's "Try ..." links).
  const { mode } = await searchParams;
  const data = await readStore();
  const active = activePersona(data);

  if (!active) {
    redirect("/onboarding");
  }

  return (
    <main className="flex flex-1 justify-center px-4 pb-12 sm:px-6">
      <GenerationScreen
        voices={data.personas.map(({ id, name, platforms }) => ({ id, name, platforms }))}
        initialVoiceId={active.id}
        contacts={data.contacts.map(({ id, name, relationship }) => ({ id, name, relationship }))}
        templates={data.templates.map(({ id, name }) => ({ id, name }))}
        voiceInput={data.settings.voiceInput}
        dictationLanguage={data.settings.dictationLanguage}
        words={data.words}
        initialMode={isOneOf(MODES, mode) ? mode : undefined}
      />
    </main>
  );
}
