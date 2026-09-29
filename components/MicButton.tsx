"use client";

import { Mic, Square } from "lucide-react";
import type { Dictation } from "@/lib/useDictation";

/**
 * Mic toggle for a text field. Rendered only when voice input is on in
 * Settings and the browser can dictate. `active` is whether this field is the
 * one receiving the words (several fields can share one dictation).
 */
export function MicButton({
  dictation,
  active = true,
  onPress,
  className = "",
}: {
  dictation: Dictation;
  active?: boolean;
  /** Runs instead of a plain toggle (e.g. to point dictation at this field first). */
  onPress?: () => void;
  className?: string;
}) {
  if (!dictation.supported) return null;
  const on = dictation.listening && active;
  return (
    <button
      type="button"
      onClick={onPress ?? dictation.toggle}
      aria-label={on ? "Stop dictating" : "Dictate"}
      aria-pressed={on}
      title={on ? "Stop dictating (Esc)" : "Dictate"}
      className={`grid h-9 w-9 place-items-center rounded-sm transition-colors ${
        on
          ? "bg-primary text-on-primary hover:bg-primary-hover"
          : "text-ink-65 hover:bg-surface-hover hover:text-ink"
      } ${className}`}
    >
      {on ? <Square size={14} strokeWidth={2.5} fill="currentColor" /> : <Mic size={18} strokeWidth={2} />}
    </button>
  );
}

/** Live line under the field: what's being heard, or why dictation stopped. */
export function DictationStatus({ dictation }: { dictation: Dictation }) {
  if (dictation.error) {
    return (
      <p role="alert" className="text-ui text-ink">
        {dictation.error}
      </p>
    );
  }
  if (!dictation.listening) return null;
  return (
    <p role="status" aria-live="polite" className="flex items-start gap-2 text-ui text-ink-65">
      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-pill bg-ink motion-safe:animate-pulse" />
      <span>
        <span className="font-medium text-ink">Listening</span>
        {dictation.interim ? (
          <span className="italic"> — {dictation.interim}</span>
        ) : (
          <span> — talk naturally; &ldquo;um&rdquo;s and do-overs get cleaned up. Esc to stop.</span>
        )}
      </span>
    </p>
  );
}

export default MicButton;
