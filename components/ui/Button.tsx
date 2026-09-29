import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "accent" | "primary" | "secondary" | "quiet" | "danger" | "destructive";
export type ButtonSize = "md" | "sm";

interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

// Every button is a pill. Buttons don't move on press. Disabled is a
// surface-press fill with ink-40 text, never an opacity fade.
const BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill border transition-[background-color,border-color,color,filter] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-press disabled:text-ink-40 disabled:shadow-none disabled:filter-none";

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 py-2.5 text-body",
  sm: "min-h-9 px-4 py-2 text-ui",
};

const INK_FILL =
  "border-transparent bg-primary font-normal text-on-primary shadow-btn-inset hover:bg-primary-hover hover:brightness-[1.3]";
const QUIET = "border-transparent bg-transparent font-medium hover:bg-surface-hover hover:text-ink";

const VARIANTS: Record<ButtonVariant, string> = {
  // The one main action per screen.
  accent: "border-transparent bg-accent font-medium text-on-dark shadow-btn-inset hover:brightness-[1.15]",
  primary: INK_FILL,
  secondary: "border-ink-50 bg-transparent font-semibold text-ink hover:border-ink hover:bg-surface-hover",
  quiet: `${QUIET} text-ink-65`,
  // No red: the label carries the meaning ("Delete").
  danger: `${QUIET} text-ink`,
  // Only for the final "yes, delete it" of an irreversible action.
  destructive: INK_FILL,
};

/**
 * Small text-only action ("Copy", "Edit", "more options"): 36px tall with
 * 12px sides, so a row of them lines up with the card edge using -ml-3.
 */
export const TEXT_BUTTON =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 text-ui font-medium text-ink-65 transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink-40";

/** Class string for anything that should look like a button (e.g. a Link). */
export function buttonClasses({ variant = "primary", size = "md", block = false }: ButtonStyle = {}) {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}${block ? " w-full" : ""}`;
}

/** The one button in CopyDogg — see "Components → Button" in docs/design-system.md. */
export default function Button({
  variant,
  size,
  block,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle) {
  return (
    <button
      type={type}
      {...props}
      className={`${buttonClasses({ variant, size, block })} ${className}`}
    />
  );
}
