import { connection } from "next/server";
import { readStore } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import LibraryList from "./LibraryList";

export default async function LibraryPage() {
  await connection(); // reads the data file, so render per request
  const { generations } = await readStore();

  const saved = generations
    .filter((g) => g.saved)
    .reverse()
    .map((g) => ({
      id: g.id,
      platform: g.platform,
      prompt_input: g.promptInput,
      outputs: g.outputs,
      chosen_output: g.chosenOutput,
      created_at: g.createdAt,
    }));

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <LibraryList generations={saved} />
      </main>
    </>
  );
}
