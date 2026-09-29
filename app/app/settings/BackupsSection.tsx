"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreFromBackup } from "@/app/actions";
import { TEXT_BUTTON, buttonClasses } from "@/components/ui/Button";

interface Backup {
  name: string;
  date: string;
  bytes: number;
}

const META = "label";

function describe(backup: Backup) {
  const day = backup.name.match(/copydogg-(\d{4}-\d{2}-\d{2})/)?.[1] ?? backup.date.slice(0, 10);
  const label = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return backup.name.includes("before-restore") ? `${label} (before a restore)` : label;
}

/** Daily copies of the data file, with one-click restore. */
export default function BackupsSection({ backups, folder }: { backups: Backup[]; folder: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function restore(backup: Backup) {
    setMessage(null);
    startTransition(async () => {
      const result = await restoreFromBackup(backup.name).catch(() => ({
        ok: false as const,
        error: "Couldn't reach CopyDogg. Check that it's still running.",
      }));
      setConfirming(null);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setMessage({ ok: true, text: `Restored ${describe(backup)}. Your data from just before is in the list too.` });
      router.refresh();
    });
  }

  return (
    <section>
      <p className={META}>Backups</p>
      <p className="mt-3 text-body text-ink-65">
        CopyDogg keeps a copy of your data from each day you use it (the last 14), in:
      </p>
      <p className="mt-2 break-all rounded-md bg-surface-warm px-3 py-2 font-mono text-micro leading-normal text-ink">
        {folder}
      </p>

      {backups.length === 0 ? (
        <p className="mt-3 text-body text-ink-65">
          No backups yet — the first one is made the next day you use CopyDogg.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border-soft">
          {backups.map((b) => (
            <li key={b.name} className="flex flex-wrap items-center justify-between gap-2 py-2 text-ui">
              <span className="text-ink">
                {describe(b)}{" "}
                <span className="label">{Math.max(1, Math.round(b.bytes / 1024))} KB</span>
              </span>
              {confirming === b.name ? (
                <span className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-ink-65">Replace your current data?</span>
                  <button
                    type="button"
                    onClick={() => restore(b)}
                    disabled={pending}
                    className={buttonClasses({ size: "sm" })}
                  >
                    {pending ? "restoring..." : "Restore"}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className={TEXT_BUTTON}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(b.name)}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-2 text-ui font-medium ${message.ok ? "text-success" : "text-ink"}`}>{message.text}</p>
      )}
    </section>
  );
}
