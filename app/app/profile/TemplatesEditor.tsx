"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { saveTemplates } from "@/app/actions";
import { buttonClasses } from "@/components/ui/Button";
import { FIELD } from "@/components/ui/Field";

interface TemplateRow {
  id?: string;
  key: string;
  name: string;
  body: string;
}

const INPUT = `${FIELD} min-w-0`;

let nextKey = 0;

/** Reusable shapes (weekly update, launch post...) picked under "more options". */
export default function TemplatesEditor({
  initial,
}: {
  initial: { id: string; name: string; body: string }[];
}) {
  const [templates, setTemplates] = useState<TemplateRow[]>(initial.map((t) => ({ ...t, key: t.id })));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function update(key: string, patch: Partial<TemplateRow>) {
    setTemplates((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    setError("");
    const result = await saveTemplates(
      templates.map(({ id, name, body }) => ({ id, name, body }))
    ).catch(() => ({ ok: false as const, error: "Couldn't reach CopyDogg. Check that it's still running." }));
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setTemplates(result.items.map((t) => ({ ...t, key: t.id })));
    setStatus("saved");
  }

  return (
    <section id="templates" className="flex scroll-mt-20 flex-col gap-4 rounded-md border border-border bg-surface p-4 sm:p-6">
      <div>
        <h2 className="font-display text-h3 text-ink">Templates</h2>
        <p className="mt-1 text-body text-ink-65">
          A structure you reuse. Pick it under &ldquo;more options&rdquo; and your idea fills it in.
        </p>
      </div>

      {templates.length === 0 && (
        <p className="rounded-md bg-surface-warm px-4 py-3 text-body text-ink-65">No templates yet — a weekly update or launch post is a good first one.</p>
      )}

      {templates.map((t) => (
        <div key={t.key} className="flex flex-col gap-2 border-t border-border-soft pt-4 first:border-0 first:pt-0">
          <div className="flex gap-2">
            <input
              value={t.name}
              onChange={(e) => update(t.key, { name: e.target.value })}
              placeholder="Name, e.g. Weekly update"
              aria-label="Template name"
              className={`flex-1 ${INPUT}`}
            />
            <button
              type="button"
              onClick={() => {
                setTemplates((prev) => prev.filter((x) => x.key !== t.key));
                setStatus("idle");
              }}
              aria-label={`Remove ${t.name || "this template"}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-ink-65 transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            value={t.body}
            onChange={(e) => update(t.key, { body: e.target.value })}
            rows={4}
            placeholder={"What I shipped: ...\nWhat I learned: ...\nWhat's next: ..."}
            aria-label="Template structure"
            className={`resize-y ${INPUT}`}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setTemplates((prev) => [...prev, { key: `new-${++nextKey}`, name: "", body: "" }])}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Add template
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className={buttonClasses({ size: "sm" })}
        >
          {status === "saving" ? "saving..." : "Save templates"}
        </button>
        {status === "saved" && <span role="status" className="text-ui font-medium text-success">Saved.</span>}
      </div>
      {status === "error" && <p role="alert" className="text-ui text-ink">{error}</p>}
    </section>
  );
}
