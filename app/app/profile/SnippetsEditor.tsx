"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { saveSnippets } from "@/app/actions";
import { buttonClasses } from "@/components/ui/Button";
import { FIELD } from "@/components/ui/Field";

interface SnippetRow {
  id?: string;
  key: string;
  trigger: string;
  text: string;
}

const INPUT = `${FIELD} min-w-0`;

let nextKey = 0;

/**
 * Saved text (bio, address, links) that goes in word for word when you say
 * or type its shortcut, e.g. "…and add my calendar link".
 */
export default function SnippetsEditor({
  initial,
}: {
  initial: { id: string; trigger: string; text: string }[];
}) {
  const [snippets, setSnippets] = useState<SnippetRow[]>(initial.map((s) => ({ ...s, key: s.id })));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function update(key: string, patch: Partial<SnippetRow>) {
    setSnippets((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    setError("");
    const result = await saveSnippets(
      snippets.map(({ id, trigger, text }) => ({ id, trigger, text }))
    ).catch(() => ({ ok: false as const, error: "Couldn't reach CopyDogg. Check that it's still running." }));
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setSnippets(result.items.map((s) => ({ ...s, key: s.id })));
    setStatus("saved");
  }

  return (
    <section id="snippets" className="flex scroll-mt-6 flex-col gap-4 rounded-md border border-hairline bg-card p-4 sm:p-6">
      <div>
        <h2 className="font-display text-heading text-ink">Snippets</h2>
        <p className="mt-1 text-body text-ink-soft">
          Text you use often. Say or type the shortcut — &ldquo;&hellip;and add my calendar
          link&rdquo; — and the saved text goes in exactly as written.
        </p>
      </div>

      {snippets.length === 0 && (
        <p className="text-body text-ink-soft">
          No snippets yet — your bio, address or booking link are good first ones.
        </p>
      )}

      {snippets.map((s) => (
        <div key={s.key} className="flex flex-col gap-2 border-t border-dashed border-control pt-4 first:border-0 first:pt-0">
          <div className="flex gap-2">
            <input
              value={s.trigger}
              onChange={(e) => update(s.key, { trigger: e.target.value })}
              placeholder="Shortcut, e.g. my calendar link"
              aria-label="Snippet shortcut"
              className={`flex-1 ${INPUT}`}
            />
            <button
              type="button"
              onClick={() => {
                setSnippets((prev) => prev.filter((x) => x.key !== s.key));
                setStatus("idle");
              }}
              aria-label={`Remove ${s.trigger || "this snippet"}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-ink-soft transition-colors hover:bg-highlight-soft hover:text-danger"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            value={s.text}
            onChange={(e) => update(s.key, { text: e.target.value })}
            rows={3}
            placeholder="https://cal.com/you/30min"
            aria-label="Snippet text"
            className={`resize-y ${INPUT}`}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSnippets((prev) => [...prev, { key: `new-${++nextKey}`, trigger: "", text: "" }])}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Add snippet
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className={buttonClasses({ size: "sm" })}
        >
          {status === "saving" ? "saving..." : "Save snippets"}
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
