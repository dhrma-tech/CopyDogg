import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Text fields: surface fill, ink-50 edge (3.3:1), 16px text so iOS doesn't
 * zoom, ink edge on hover, ink edge + soft ring on focus. Invalid gets a 2px
 * ink edge (no red) — pair it with a message below the field.
 */
const FIELD_BASE =
  "w-full rounded-lg border border-ink-50 bg-surface text-body text-ink placeholder:text-ink-50 transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:shadow-ring focus:outline-none aria-[invalid=true]:border-2 aria-[invalid=true]:border-ink";

export const FIELD = `${FIELD_BASE} px-4 py-3`;

/** Compact dropdown used inline in option rows. */
export const SELECT =
  "min-h-9 max-w-full rounded-pill border border-ink-50 bg-surface px-3.5 text-ui text-ink transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:shadow-ring focus:outline-none";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_BASE} h-12 px-4 ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD} resize-none ${className}`} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${SELECT} ${className}`} />;
}
