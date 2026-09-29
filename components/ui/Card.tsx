import type { HTMLAttributes } from "react";

export type CardVariant = "main" | "flat";

const VARIANTS: Record<CardVariant, string> = {
  // The one elevated surface per screen: cream fill, soft float shadow.
  main: "rounded-2xl border border-border-strong bg-surface-cream p-4 shadow-float sm:p-6",
  // Everything else: a quiet bordered box.
  flat: "rounded-md border border-border bg-surface p-4 transition-colors",
};

export function cardClasses(variant: CardVariant = "flat") {
  return VARIANTS[variant];
}

/** Extra classes for a flat card that is clickable as a whole. */
export const CARD_LIFT =
  "transition-[border-color,box-shadow,transform] duration-[250ms] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-hover-sm";

export default function Card({
  variant = "flat",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div {...props} className={`${VARIANTS[variant]} ${className}`} />;
}
