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
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-4 rounded-full bg-ink py-2 pl-5 pr-2 text-sm text-card shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={undo}
          className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent"
        >
          Undo
        </button>
      </div>
    </div>
  ) : null;

  return { show, undo, element };
}
