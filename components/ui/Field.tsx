import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Text fields: card fill, control edge (3:1), 16px text so iOS doesn't zoom,
 * ink edge on hover, ink edge + highlight ring on focus, danger edge when
 * aria-invalid.
 */
export const FIELD =
  "w-full rounded-md border border-control bg-card px-4 py-3 text-body text-ink placeholder:text-ink-soft transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-highlight aria-[invalid=true]:border-danger";

/** Compact dropdown used inline in option rows. */
export const SELECT =
  "min-h-9 max-w-full rounded-chip border border-control bg-card px-3 text-small font-medium text-ink transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-highlight";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD} ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD} resize-none ${className}`} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${SELECT} ${className}`} />;
}
