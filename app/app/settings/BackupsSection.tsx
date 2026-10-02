"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreFromBackup } from "@/app/actions";
import { buttonClasses } from "@/components/ui/Button";
import { SettingRow } from "./SettingsLayout";

interface Backup {
  name: string;
  date: string;
  bytes: number;
}

const QUIET = buttonClasses({ variant: "quiet", size: "sm" });
const SHOWN_AT_FIRST = 3;

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
  const [showAll, setShowAll] = useState(false);
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

  const shown = showAll ? backups : backups.slice(0, SHOWN_AT_FIRST);

  return (
    <SettingRow
      title="Daily backups"
      description={
        <>
          A copy from each day you use CopyDogg, the last 14.
          <span className="mt-1 block break-all font-mono text-micro text-ink">{folder}</span>
        </>
      }
    >
      {backups.length === 0 ? (
        <p className="mt-3 rounded-md bg-surface-warm px-4 py-3 text-ui text-ink-65">
          No backups yet. The first one is made the next day you use CopyDogg.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border-soft rounded-md bg-surface-warm px-4">
          {shown.map((b) => (
            <li key={b.name} className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5">
              <span className="flex items-baseline gap-2 text-ui text-ink">
                {describe(b)}
                <span className="label">{Math.max(1, Math.round(b.bytes / 1024))} KB</span>
              </span>
              {confirming === b.name ? (
                <span className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-ui text-ink-65">Replace your current data?</span>
                  <button type="button" onClick={() => setConfirming(null)} className={QUIET}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => restore(b)}
                    disabled={pending}
                    className={buttonClasses({ size: "sm" })}
                  >
                    {pending ? "restoring..." : "Restore"}
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

      {backups.length > SHOWN_AT_FIRST && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`mt-2 -ml-4 ${QUIET}`}>
          {showAll ? "Show fewer" : `Show all ${backups.length}`}
        </button>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-2 text-ui font-medium ${message.ok ? "text-success" : "text-ink"}`}
        >
          {message.text}
        </p>
      )}
    </SettingRow>
  );
}
