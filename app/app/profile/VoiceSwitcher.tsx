"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVoice, deleteVoice, selectVoice } from "@/app/actions";
import { buttonClasses } from "@/components/ui/Button";
import { chipClasses } from "@/components/ui/Chip";
import { FIELD } from "@/components/ui/Field";

const PILL_ON = chipClasses(true);
const PILL_OFF = chipClasses(false);

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
            className={`${chipClasses(false)} border-dashed border-ink-50`}
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
          className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
        >
          <p className="text-body text-ink-65">
            Starts as a copy of <span className="font-medium text-ink">{active?.name}</span>, then
            adjust it below.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Work me, Friends me"
              aria-label="New voice name"
              autoFocus
              className={`${FIELD} min-w-0 flex-[1_1_200px]`}
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className={buttonClasses()}
            >
              {pending ? "copying..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className={buttonClasses({ variant: "quiet" })}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {voices.length > 1 && !adding && (
        <div className="text-ui">
          {confirmingDelete ? (
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-ink">
                Delete &ldquo;{active?.name}&rdquo;? Its posts stay in your library.
              </span>
              <button
                type="button"
                onClick={() => run(() => deleteVoice(activeId), () => setConfirmingDelete(false))}
                disabled={pending}
                className={`${buttonClasses({ variant: "danger", size: "sm" })} -ml-3`}
              >
                Delete voice
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-ink-65">
                Keep it
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-ink-65 underline decoration-ink-50 underline-offset-2 hover:text-ink"
            >
              Delete this voice
            </button>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-ui text-ink">{error}</p>}
    </section>
  );
}
