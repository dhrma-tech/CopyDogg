"use client";

import { useEffect, useRef, useState } from "react";

const UNDO_WINDOW_MS = 5000;

interface Pending {
  id: number;
  onUndo: () => void;
  onCommit?: () => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * "Done — Undo" instead of "Are you sure?". The action shows as done right
 * away; `onCommit` runs when the toast times out, another toast replaces it,
 * or the page unmounts. `onUndo` puts things back.
 */
export function useUndoToast() {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const pending = useRef<Pending | null>(null);
  const counter = useRef(0);

  function commitPending() {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    p.onCommit?.();
  }

  function show(message: string, actions: { onUndo: () => void; onCommit?: () => void }) {
    commitPending();
    const id = ++counter.current;
    const timer = setTimeout(() => {
      if (pending.current?.id !== id) return;
      pending.current = null;
      setToast(null);
      actions.onCommit?.();
    }, UNDO_WINDOW_MS);
    pending.current = { id, timer, ...actions };
    setToast({ id, message });
  }

  function undo() {
    const p = pending.current;
    if (!p) return false;
    clearTimeout(p.timer);
    pending.current = null;
    setToast(null);
    p.onUndo();
    return true;
  }

  // Leaving the page within the window keeps the action (it already looked done).
  useEffect(() => () => commitPending(), []);

  const element = toast ? (
    <div
      role="status"
      className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-5"
    >
      {/* bg-dark pill with a cream action; inverts to a cream pill in dark mode. */}
      <div className="flex items-center gap-3 whitespace-nowrap rounded-pill bg-[var(--toast-bg)] py-1.5 pl-5 pr-1.5 text-ui text-[var(--toast-text)] motion-safe:animate-[toast-in_200ms_var(--ease-out-soft)]">
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={undo}
          className="h-8 rounded-pill bg-[var(--toast-action-bg)] px-3.5 text-ui font-medium text-[var(--toast-action-text)] transition-colors hover:bg-[var(--toast-action-hover)]"
        >
          Undo
        </button>
      </div>
    </div>
  ) : null;

  return { show, undo, element };
}
