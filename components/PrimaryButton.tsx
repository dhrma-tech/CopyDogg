import type { ButtonHTMLAttributes } from "react";

/**
 * The one primary-button style in the app (--ink bg / --card text, per
 * design-system.md). Shared so "Generate posts" and "Send magic link"
 * can never visually drift apart again.
 */
export default function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-ink px-5 py-3 text-sm font-bold text-card disabled:opacity-90 ${className}`}
    />
  );
}
