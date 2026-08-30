import { ChevronDown } from "lucide-react";

interface PersonaSelectorProps {
  name: string;
}

/**
 * v1 ships one default persona (multi-persona switching is cut from v1 —
 * see PLAN.md "Explicitly out of scope"), so this isn't wired to a real
 * switcher yet — but it should still read as one, since that's its role
 * per product-plan.md's main-screen layout.
 */
export default function PersonaSelector({ name }: PersonaSelectorProps) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
      {name}
      <ChevronDown size={14} strokeWidth={2.5} />
    </span>
  );
}
