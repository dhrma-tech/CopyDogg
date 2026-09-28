import { connection } from "next/server";
import { readStore } from "@/lib/store";
import LibraryList, { type LibraryGeneration } from "./LibraryList";

const RECENT_LIMIT = 100;

export default async function LibraryPage() {
  await connection(); // reads the data file, so render per request
  const { generations, ideas } = await readStore();

  // Newest first. Everything goes to the client once, so tabs, search and
  // sorting are instant.
  const items: LibraryGeneration[] = generations
    .slice(-RECENT_LIMIT)
    .reverse()
    .map((g) => ({
      id: g.id,
      platform: g.platform,
      mode: g.mode ?? "write",
      promptInput: g.promptInput,
      context: g.context ?? null,
      outputs: g.outputs,
      chosenOutput: g.chosenOutput,
      saved: g.saved,
      createdAt: g.createdAt,
    }));
  // Saved posts older than the recent window still belong in Saved.
  const olderSaved = generations
    .slice(0, Math.max(0, generations.length - RECENT_LIMIT))
    .filter((g) => g.saved)
    .reverse()
    .map((g) => ({
      id: g.id,
      platform: g.platform,
      mode: g.mode ?? "write",
      promptInput: g.promptInput,
      context: g.context ?? null,
      outputs: g.outputs,
      chosenOutput: g.chosenOutput,
      saved: true,
      createdAt: g.createdAt,
    }));

  return (
    <main className="flex flex-1 justify-center px-6 pb-12">
      <LibraryList
        generations={[...items, ...olderSaved]}
        ideas={[...ideas].reverse()}
      />
    </main>
  );
}
