import type { HTMLAttributes } from "react";

export type CardVariant = "main" | "flat";

const VARIANTS: Record<CardVariant, string> = {
  // The one elevated surface per screen: ink border + ink offset shadow.
  main: "rounded-lg border-[1.5px] border-ink bg-card p-4 shadow-card sm:p-6",
  // Everything else: a quiet hairline box.
  flat: "rounded-md border border-hairline bg-card p-4 transition-colors",
};

export function cardClasses(variant: CardVariant = "flat") {
  return VARIANTS[variant];
}

export default function Card({
  variant = "flat",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div {...props} className={`${VARIANTS[variant]} ${className}`} />;
}
