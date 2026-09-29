import type { ButtonHTMLAttributes } from "react";

export type ChipSize = "md" | "sm";

const BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border text-ui transition-colors disabled:cursor-not-allowed";
const SIZES: Record<ChipSize, string> = {
  md: "min-h-9 px-3.5",
  sm: "min-h-8 px-3",
};
const ON = "border-primary bg-primary text-on-primary";
const OFF =
  "border-ink-50 bg-transparent text-ink hover:bg-surface-hover disabled:border-border disabled:bg-transparent disabled:text-ink-40 disabled:line-through";

/** Class string for chip-shaped things that aren't toggle buttons (tags, links). */
export function chipClasses(pressed: boolean, size: ChipSize = "md") {
  return `${BASE} ${SIZES[size]} ${pressed ? ON : OFF}`;
}

/**
 * Toggle pill for platforms, situations, tweaks and filters. Selected = ink
 * fill (cream in dark mode); the state is also exposed as aria-pressed.
 */
export default function Chip({
  pressed = false,
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean; size?: ChipSize }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      {...props}
      className={`${chipClasses(pressed, size)} ${className}`}
    />
  );
}
