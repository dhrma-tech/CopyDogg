import { redirect } from "next/navigation";
import { connection } from "next/server";
import { readStore } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import ProfileForm from "./ProfileForm";
import PeopleEditor from "./PeopleEditor";
import TemplatesEditor from "./TemplatesEditor";

export default async function ProfilePage() {
  await connection(); // reads the data file, so render per request
  const { persona, topics, contacts, templates, generations } = await readStore();

  if (!persona) {
    redirect("/onboarding");
  }

  const learnableCount = generations.filter(
    (g) => (g.feedback === 1 || g.edited) && g.chosenOutput
  ).length;

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-6 px-6 pb-12">
        <ProfileForm
          persona={persona}
          initialTopics={topics.map((t) => t.label)}
          learnableCount={learnableCount}
        />
        <div className="flex w-full max-w-lg flex-col gap-6">
          <PeopleEditor initial={contacts} />
          <TemplatesEditor initial={templates} />
        </div>
      </main>
    </>
  );
}
