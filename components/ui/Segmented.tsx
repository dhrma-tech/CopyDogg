/**
 * Segmented control styling (mode switch, library tabs, appearance). Pages keep
 * their own semantics (buttons with aria-pressed, or role="tab"); these only
 * style the track and the items.
 */
export const SEGMENT_TRACK = "flex gap-0.5 rounded-pill border border-border-mid bg-surface-press p-1";

/**
 * `accent` is only for the /app mode switch (the reference's active tab
 * pill); everywhere else the selected segment is an ink fill, so the green
 * stays one-per-screen.
 */
export function segmentClasses(selected: boolean, { accent = false }: { accent?: boolean } = {}) {
  const base = "min-h-9 flex-auto whitespace-nowrap rounded-pill px-2 py-1.5 text-ui transition-colors sm:px-3";
  if (!selected) return `${base} text-ink-65 hover:text-ink`;
  return `${base} font-medium ${accent ? "bg-accent text-on-dark" : "bg-primary text-on-primary"}`;
}
