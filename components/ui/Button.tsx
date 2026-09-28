import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "md" | "sm";

interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-md border font-semibold transition-[background-color,border-color,color,box-shadow,transform] active:translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-body",
  sm: "min-h-9 px-3.5 text-small",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-on-primary shadow-raise hover:bg-primary-hover disabled:bg-hairline disabled:text-ink-soft disabled:shadow-none",
  secondary:
    "border-control bg-transparent text-ink hover:border-ink hover:bg-highlight-soft disabled:border-hairline disabled:bg-transparent disabled:text-ink-soft",
  quiet:
    "border-transparent bg-transparent font-medium text-ink-soft hover:bg-highlight-soft hover:text-ink disabled:bg-transparent disabled:text-ink-soft",
  danger:
    "border-transparent bg-transparent font-medium text-danger hover:underline disabled:no-underline disabled:text-ink-soft",
};

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
