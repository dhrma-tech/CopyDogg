import type { ButtonHTMLAttributes } from "react";

export type ChipSize = "md" | "sm";

const BASE =
  "inline-flex shrink-0 items-center gap-1.5 rounded-chip border font-medium transition-colors disabled:cursor-not-allowed";
const SIZES: Record<ChipSize, string> = {
  md: "min-h-9 px-3.5 text-small",
  sm: "min-h-8 px-3 text-small",
};
const ON = "border-on-highlight bg-highlight text-on-highlight hover:bg-highlight-hover";
const OFF =
  "border-hairline bg-transparent text-ink-soft hover:border-control hover:text-ink disabled:border-hairline disabled:text-ink-soft disabled:line-through";

/** Class string for chip-shaped things that aren't toggle buttons (tags, links). */
export function chipClasses(pressed: boolean, size: ChipSize = "md") {
  return `${BASE} ${SIZES[size]} ${pressed ? ON : OFF}`;
}

/**
 * Toggle pill for platforms, situations, tweaks and filters. Selected =
 * highlight fill; the state is also exposed as aria-pressed.
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
