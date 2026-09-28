"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVoice, deleteVoice, selectVoice } from "@/app/actions";

const PILL_ON = "rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent";
const PILL_OFF = "rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink";

/**
 * Pick which voice the form below edits, add a new one (a copy of the current
 * one, ready to adjust), or delete one.
 */
export default function VoiceSwitcher({
  voices,
  activeId,
}: {
  voices: { id: string; name: string }[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const active = voices.find((v) => v.id === activeId);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError("");
    startTransition(async () => {
      const result = await action().catch(() => ({ ok: false, error: "Couldn't reach CopyDogg." }));
      if (!result.ok) {
        setError(result.error ?? "Something didn't save. Try again.");
        return;
      }
      after?.();
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Voices">
      <div className="flex flex-wrap items-center gap-2">
        {voices.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => v.id !== activeId && run(() => selectVoice(v.id))}
            aria-pressed={v.id === activeId}
            disabled={pending}
            className={v.id === activeId ? PILL_ON : PILL_OFF}
          >
            {v.name}
          </button>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setConfirmingDelete(false);
            }}
            className="rounded-full border border-dashed border-hairline px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            + New voice
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createVoice(activeId, newName),
              () => {
                setAdding(false);
                setNewName("");
              }
            );
          }}
          className="flex flex-col gap-2 rounded-md border border-dashed border-hairline bg-card p-3"
        >
          <p className="text-sm text-ink-soft">
            Starts as a copy of <span className="font-medium text-ink">{active?.name}</span>, then
            adjust it below.
          </p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Work me, Friends me"
              aria-label="New voice name"
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-hairline bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-card disabled:opacity-60"
            >
              {pending ? "copying..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full px-2 text-sm text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {voices.length > 1 && !adding && (
        <div className="text-sm">
          {confirmingDelete ? (
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-ink">
                Delete &ldquo;{active?.name}&rdquo;? Its posts stay in your library.
              </span>
              <button
                type="button"
                onClick={() => run(() => deleteVoice(activeId), () => setConfirmingDelete(false))}
                disabled={pending}
                className="font-bold text-danger"
              >
                Delete voice
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-ink-soft">
                Keep it
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-ink-soft underline hover:text-danger"
            >
              Delete this voice
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
