"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SEND_LABELS, platformRules, sendLink, type Platform } from "@/lib/platformRules";
import { MODE_LABELS, type GenerateMode } from "@/lib/writingOptions";
import { patchGeneration } from "@/lib/generateClient";
import { prefillIdea } from "@/lib/draft";
import { removeIdea } from "@/app/actions";
import { useUndoToast } from "@/components/UndoToast";
import { TEXT_BUTTON, buttonClasses } from "@/components/ui/Button";
import { chipClasses } from "@/components/ui/Chip";
import { FIELD } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { SEGMENT_TRACK, segmentClasses } from "@/components/ui/Segmented";

export interface LibraryGeneration {
  id: string;
  platform: Platform;
  mode: GenerateMode;
  promptInput: string;
  context: string | null;
  outputs: string[];
  chosenOutput: string | null;
  saved: boolean;
  createdAt: string;
}

interface Idea {
  id: string;
  text: string;
  createdAt: string;
}

type Tab = "saved" | "recent" | "ideas";

const META = "label";
const PILL_ON = chipClasses(true, "sm");
const PILL_OFF = chipClasses(false, "sm");
const CARD = "rounded-md border border-border bg-surface p-4";
// Copy / Unsave / Delete under a post; lines up with the card edge.
const ACTION_ROW = "mt-2 -ml-3 flex flex-wrap items-center gap-1";
// Under an idea: a divider, then "Write it now" and Delete.
const IDEA_ROW = "mt-3 flex flex-wrap items-center gap-1 border-t border-border-soft pt-2";
const SORT_BUTTON =
  "inline-flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-pill border border-ink-50 px-4 text-ui font-semibold text-ink transition-colors hover:border-ink hover:bg-surface-hover";
const WRITE_LINK = buttonClasses({ variant: "secondary", size: "sm" });

async function deleteGenerationRequest(id: string): Promise<boolean> {
  try {
    return (await fetch(`/api/generations/${id}`, { method: "DELETE" })).ok;
  } catch {
    return false;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** What the user started from, shown small above the text. */
function sourceLine(g: LibraryGeneration) {
  if (g.mode === "reply") return `reply to: ${g.context ?? ""}`;
  if (g.mode === "rewrite") return `rewrite of: ${g.context ?? ""}`;
  if (g.mode === "tweak") return `tweak of an earlier version`;
  return g.promptInput;
}

export default function LibraryList({
  generations: initialGenerations,
  ideas: initialIdeas,
}: {
  generations: LibraryGeneration[];
  ideas: Idea[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("saved");
  const [generations, setGenerations] = useState(initialGenerations);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [error, setError] = useState("");
  const toast = useUndoToast();

  const saved = generations.filter((g) => g.saved);
  const presentPlatforms = [...new Set(generations.map((g) => g.platform))];

  function matches(g: LibraryGeneration) {
    if (platformFilter !== "all" && g.platform !== platformFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${g.promptInput} ${g.context ?? ""} ${g.outputs.join(" ")} ${g.chosenOutput ?? ""}`
      .toLowerCase()
      .includes(q);
  }

  const list = (tab === "saved" ? saved : generations).filter(matches);
  if (!newestFirst) list.reverse();

  function update(id: string, patch: Partial<LibraryGeneration>) {
    setGenerations((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  async function handleSaveToggle(g: LibraryGeneration, text: string | null) {
    setError("");
    const saving = text !== null;
    const previous = { saved: g.saved, chosenOutput: g.chosenOutput };
    update(g.id, saving ? { saved: true, chosenOutput: text } : { saved: false });
    const ok = await patchGeneration(
      g.id,
      saving ? { saved: true, chosen_output: text } : { saved: false }
    );
    if (!ok) {
      update(g.id, previous);
      setError("Couldn't update that. Try again.");
      return;
    }
    if (!saving) {
      toast.show("Unsaved", {
        onUndo: () => void handleSaveToggle({ ...g, saved: false }, previous.chosenOutput ?? g.outputs[0]),
      });
    }
  }

  function restore(g: LibraryGeneration) {
    setGenerations((prev) =>
      [...prev.filter((x) => x.id !== g.id), g].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  }

  /** Hidden at once; only deleted for real when the undo toast goes away. */
  function handleDelete(g: LibraryGeneration) {
    setError("");
    setGenerations((prev) => prev.filter((x) => x.id !== g.id));
    toast.show("Deleted", {
      onUndo: () => restore(g),
      onCommit: async () => {
        if (!(await deleteGenerationRequest(g.id))) {
          restore(g);
          setError("Couldn't delete that. Try again.");
        }
      },
    });
  }

  function writeFromIdea(idea: Idea) {
    prefillIdea(idea.text);
    router.push("/app");
  }

  function restoreIdea(idea: Idea) {
    setIdeas((prev) =>
      [...prev.filter((i) => i.id !== idea.id), idea].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  }

  function deleteIdeaById(idea: Idea) {
    setError("");
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    toast.show("Idea deleted", {
      onUndo: () => restoreIdea(idea),
      onCommit: async () => {
        const result = await removeIdea(idea.id).catch(() => ({ ok: false as const }));
        if (!result.ok) {
          restoreIdea(idea);
          setError("Couldn't delete that idea. Try again.");
        }
      },
    });
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "saved", label: "Saved", count: saved.length },
    { id: "recent", label: "Recent", count: generations.length },
    { id: "ideas", label: "Ideas", count: ideas.length },
  ];

  return (
    <div className="w-full max-w-2xl">
      <h1 className="font-display text-h3 text-ink">Library</h1>

      <div className={`mt-5 ${SEGMENT_TRACK}`} role="tablist" aria-label="Library sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={segmentClasses(tab === t.id)}
          >
            {t.label} <span className="font-mono text-micro opacity-80">{t.count}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-3 text-ui text-ink">{error}</p>}

      {tab === "ideas" ? (
        ideas.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No ideas saved yet"
              action={<Link href="/app" className={WRITE_LINK}>Open the writing screen</Link>}
            >
              Tap &ldquo;save idea&rdquo; on the writing screen when one hits you.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {ideas.map((idea) => (
              <div key={idea.id} className={CARD}>
                <p className={META}>{formatDate(idea.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap text-body text-ink">{idea.text}</p>
                <div className={IDEA_ROW}>
                  <button type="button" onClick={() => writeFromIdea(idea)} className="link mr-2 text-ui font-medium">
                    Write it now
                  </button>
                  <button type="button" onClick={() => deleteIdeaById(idea)} className={TEXT_BUTTON}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "saved" ? "Search saved posts" : "Search everything you've written"}
                aria-label="Search"
                className={`${FIELD} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => setNewestFirst((v) => !v)}
                className={SORT_BUTTON}
                aria-label={newestFirst ? "Showing newest first" : "Showing oldest first"}
              >
                {newestFirst ? "newest ↓" : "oldest ↓"}
              </button>
            </div>
            {presentPlatforms.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {(["all", ...presentPlatforms] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatformFilter(p)}
                    aria-pressed={platformFilter === p}
                    className={platformFilter === p ? PILL_ON : PILL_OFF}
                  >
                    {p === "all" ? "All" : platformRules[p].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(tab === "saved" ? saved : generations).length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={tab === "saved" ? "Nothing saved yet" : "Nothing written yet"}
                action={<Link href="/app" className={WRITE_LINK}>Write a post</Link>}
              >
                Go write something worth keeping.
              </EmptyState>
            </div>
          ) : list.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="Nothing matches that">Try another word or platform.</EmptyState>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {list.map((g) =>
                tab === "saved" ? (
                  <SavedCard
                    key={g.id}
                    g={g}
                    onUnsave={() => handleSaveToggle(g, null)}
                    onDelete={() => handleDelete(g)}
                  />
                ) : (
                  <RecentCard key={g.id} g={g} onSave={(text) => handleSaveToggle(g, text)} />
                )
              )}
            </div>
          )}
        </>
      )}

      {toast.element}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1500);
      }}
      className={TEXT_BUTTON}
    >
      {state === "copied" ? "copied" : state === "failed" ? "select and copy by hand" : "Copy"}
    </button>
  );
}

function CardHeader({ g }: { g: LibraryGeneration }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={META}>
        {platformRules[g.platform]?.label ?? g.platform}
        {g.mode !== "write" && ` · ${g.mode === "tweak" ? "tweak" : MODE_LABELS[g.mode]}`}
      </p>
      <p className={META}>{formatDate(g.createdAt)}</p>
    </div>
  );
}

function SavedCard({
  g,
  onUnsave,
  onDelete,
}: {
  g: LibraryGeneration;
  onUnsave: () => void;
  onDelete: () => void;
}) {
  const text = g.chosenOutput ?? g.outputs[0];
  const link = sendLink(g.platform, text);

  return (
    <div className={CARD}>
      <CardHeader g={g} />
      <p className="mt-2 line-clamp-2 text-ui text-ink-65">{sourceLine(g)}</p>
      <p className="mt-2 whitespace-pre-wrap text-body text-ink">{text}</p>
      <div className={ACTION_ROW}>
        <CopyButton text={text} />
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="link mx-2 text-ui font-medium">
            {SEND_LABELS[g.platform] ?? "Open"}
          </a>
        )}
        <button type="button" onClick={onUnsave} className={TEXT_BUTTON}>
          Unsave
        </button>
        <button type="button" onClick={onDelete} className={TEXT_BUTTON}>
          Delete
        </button>
      </div>
    </div>
  );
}

function RecentCard({ g, onSave }: { g: LibraryGeneration; onSave: (text: string) => void }) {
  return (
    <div className={CARD}>
      <CardHeader g={g} />
      <p className="mt-2 line-clamp-2 text-ui text-ink-65">{sourceLine(g)}</p>
      <div className="mt-2 flex flex-col divide-y divide-border-soft">
        {g.outputs.map((text, i) => {
          const isSaved = g.saved && (g.chosenOutput ?? g.outputs[0]) === text;
          return (
            <div key={i} className="py-3 first:pt-1 last:pb-0">
              <p className="whitespace-pre-wrap text-body text-ink">{text}</p>
              <div className="mt-2 -ml-3 flex gap-1">
                <CopyButton text={text} />
                <button
                  type="button"
                  onClick={() => onSave(text)}
                  disabled={isSaved}
                  className={TEXT_BUTTON}
                >
                  {isSaved ? "saved" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
