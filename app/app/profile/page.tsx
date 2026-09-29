import { redirect } from "next/navigation";
import { connection } from "next/server";
import { activePersona, generationBelongsTo, readStore } from "@/lib/store";
import ProfileForm from "./ProfileForm";
import PeopleEditor from "./PeopleEditor";
import TemplatesEditor from "./TemplatesEditor";
import WordsEditor from "./WordsEditor";
import SnippetsEditor from "./SnippetsEditor";
import VoiceSwitcher from "./VoiceSwitcher";

export default async function ProfilePage() {
  await connection(); // reads the data file, so render per request
  const data = await readStore();
  const persona = activePersona(data);

  if (!persona) {
    redirect("/onboarding");
  }

  const learnableCount = data.generations.filter(
    (g) => (g.feedback === 1 || g.edited) && g.chosenOutput && generationBelongsTo(g, persona.id, data)
  ).length;

  return (
    <main className="flex flex-1 justify-center px-4 pb-12 sm:px-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <VoiceSwitcher
          voices={data.personas.map(({ id, name }) => ({ id, name }))}
          activeId={persona.id}
        />
        {/* Keyed by voice, so switching voices resets the form. */}
        <ProfileForm
          key={persona.id}
          persona={persona}
          initialTopics={data.topics.map((t) => t.label)}
          learnableCount={learnableCount}
        />
        <PeopleEditor initial={data.contacts} />
        <TemplatesEditor initial={data.templates} />
        <SnippetsEditor initial={data.snippets} />
        <WordsEditor initial={data.words} />
      </div>
    </main>
  );
}
