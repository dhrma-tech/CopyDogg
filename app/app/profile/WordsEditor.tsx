"use client";

import { useState } from "react";
import { saveWords } from "@/app/actions";
import ChipEditor from "@/components/ChipEditor";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Names, jargon and acronyms CopyDogg should spell exactly. Mostly for
 * dictation: speech recognition mishears "Priya" or "OKR", and Claude uses
 * this list to fix it. Shared by all voices.
 */
export default function WordsEditor({ initial }: { initial: string[] }) {
  const [words, setWords] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function change(next: string[]) {
    setWords(next);
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    setError("");
    const result = await saveWords(words).catch(() => ({
      ok: false as const,
      error: "Couldn't reach CopyDogg. Check that it's still running.",
    }));
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setWords(result.items);
    setStatus("saved");
  }

  return (
    <section id="words" className="flex scroll-mt-6 flex-col gap-4 rounded-md border border-hairline bg-card p-4 sm:p-6">
      <div>
        <h2 className="font-display text-heading text-ink">Your words</h2>
        <p className="mt-1 text-body text-ink-soft">
          Names, jargon and acronyms to spell exactly. When dictation mishears one, CopyDogg
          fixes it. Edit a result and it&rsquo;ll offer to add new names for you.
        </p>
      </div>

      <ChipEditor
        label="Words"
        items={words}
        onAdd={(w) => !words.some((x) => x.toLowerCase() === w.toLowerCase()) && change([...words, w])}
        onRemove={(w) => change(words.filter((x) => x !== w))}
        placeholder="Priya, OKR, Figma..."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className={buttonClasses({ size: "sm" })}
        >
          {status === "saving" ? "saving..." : "Save words"}
        </button>
        {status === "saved" && (
          <span role="status" className="text-small font-medium text-success">
            Saved.
          </span>
        )}
      </div>
      {status === "error" && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
