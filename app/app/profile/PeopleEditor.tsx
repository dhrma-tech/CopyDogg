"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { saveContacts } from "@/app/actions";
import { buttonClasses } from "@/components/ui/Button";
import { FIELD, Select } from "@/components/ui/Field";
import { RELATIONSHIPS } from "@/lib/writingOptions";

interface Person {
  /** Missing until saved; `key` keeps React rows stable meanwhile. */
  id?: string;
  key: string;
  name: string;
  relationship: string;
  note: string;
}

const INPUT = `${FIELD} min-w-0`;

let nextKey = 0;

/** People you write to, so a message to your boss and one to your sister sound different. */
export default function PeopleEditor({
  initial,
}: {
  initial: { id: string; name: string; relationship: string; note: string }[];
}) {
  const [people, setPeople] = useState<Person[]>(initial.map((p) => ({ ...p, key: p.id })));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function update(key: string, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    setError("");
    const result = await saveContacts(
      people.map(({ id, name, relationship, note }) => ({ id, name, relationship, note }))
    ).catch(() => ({ ok: false as const, error: "Couldn't reach CopyDogg. Check that it's still running." }));
    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setPeople(result.items.map((p) => ({ ...p, key: p.id })));
    setStatus("saved");
  }

  return (
    <section id="people" className="flex scroll-mt-6 flex-col gap-4 rounded-md border border-hairline bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-heading text-ink">People you write to</h2>
        <p className="mt-1 text-body text-ink-soft">
          Pick one under &ldquo;more options&rdquo; and CopyDogg matches how you&rsquo;d talk to them.
        </p>
      </div>

      {people.length === 0 && (
        <p className="text-body text-ink-soft">No one yet — add your boss, a client, a friend.</p>
      )}

      {people.map((p) => (
        <div key={p.key} className="flex flex-col gap-2 border-t border-dashed border-control pt-4 first:border-0 first:pt-0">
          <div className="flex gap-2">
            <input
              value={p.name}
              onChange={(e) => update(p.key, { name: e.target.value })}
              placeholder="Name"
              aria-label="Name"
              className={`flex-1 ${INPUT}`}
            />
            <Select
              value={p.relationship}
              onChange={(e) => update(p.key, { relationship: e.target.value })}
              aria-label="Relationship"
              variant="field"
              className={INPUT}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => {
                setPeople((prev) => prev.filter((x) => x.key !== p.key));
                setStatus("idle");
              }}
              aria-label={`Remove ${p.name || "this person"}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-ink-soft transition-colors hover:bg-highlight-soft hover:text-danger"
            >
              <X size={16} />
            </button>
          </div>
          <input
            value={p.note}
            onChange={(e) => update(p.key, { note: e.target.value })}
            placeholder="Anything to know? e.g. prefers short messages, we joke a lot"
            aria-label="Note"
            className={INPUT}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setPeople((prev) => [...prev, { key: `new-${++nextKey}`, name: "", relationship: "friend", note: "" }])
          }
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Add person
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className={buttonClasses({ size: "sm" })}
        >
          {status === "saving" ? "saving..." : "Save people"}
        </button>
        {status === "saved" && <span role="status" className="text-small font-medium text-success">Saved.</span>}
      </div>
      {status === "error" && <p role="alert" className="text-small text-danger">{error}</p>}
    </section>
  );
}
