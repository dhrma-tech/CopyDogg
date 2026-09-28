import { redirect } from "next/navigation";
import { connection } from "next/server";
import { readStore } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  await connection(); // reads the data file, so render per request
  const { persona, topics } = await readStore();

  if (!persona) {
    redirect("/onboarding");
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <ProfileForm persona={persona} initialTopics={topics.map((t) => t.label)} />
      </main>
    </>
  );
}
