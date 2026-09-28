interface PersonaSelectorProps {
  name: string;
}

/**
 * v1 ships one default persona (multi-persona switching is cut from v1 —
 * see docs/product-plan.md §8), so this is a static label, not a dropdown.
 * No chevron: a dropdown affordance with nothing behind it reads as broken.
 */
export default function PersonaSelector({ name }: PersonaSelectorProps) {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
      {name}
    </span>
  );
}
