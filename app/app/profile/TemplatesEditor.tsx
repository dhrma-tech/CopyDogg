"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { saveTemplates } from "@/app/actions";

interface TemplateRow {
  id?: string;
  key: string;
  name: string;
  body: string;
}

const INPUT =
  "min-w-0 rounded-md border border-hairline bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none";

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
    <section id="templates" className="flex flex-col gap-4 rounded-lg border border-hairline bg-card p-6">
      <div>
        <h2 className="font-display text-xl font-medium text-ink">Templates</h2>
        <p className="mt-1 text-sm text-ink-soft">
          A structure you reuse. Pick it under &ldquo;more options&rdquo; and your idea fills it in.
        </p>
      </div>

      {templates.length === 0 && (
        <p className="text-sm text-ink-soft">No templates yet — a weekly update or launch post is a good first one.</p>
      )}

      {templates.map((t) => (
        <div key={t.key} className="flex flex-col gap-2 border-t border-dashed border-hairline pt-4 first:border-0 first:pt-0">
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
              className="rounded-sm p-2 text-ink-soft hover:text-danger"
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
          className="rounded-full border border-hairline px-4 py-2 text-sm font-bold text-ink"
        >
          Add template
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-card disabled:opacity-60"
        >
          {status === "saving" ? "saving..." : "Save templates"}
        </button>
        {status === "saved" && <span className="text-sm text-accent">Saved.</span>}
      </div>
      {status === "error" && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
