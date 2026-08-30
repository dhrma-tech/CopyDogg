interface PersonaSelectorProps {
  name: string;
}

/**
 * v1 ships one default persona (multi-persona switching is cut from v1 —
 * see PLAN.md "Explicitly out of scope"), so this is a static pill for now.
 */
export default function PersonaSelector({ name }: PersonaSelectorProps) {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
      {name}
    </span>
  );
}
