/**
 * Segmented control styling (mode switch, library tabs, appearance). Pages keep
 * their own semantics (buttons with aria-pressed, or role="tab"); these only
 * style the track and the items.
 */
export const SEGMENT_TRACK = "flex gap-1 rounded-chip border border-hairline bg-paper p-1";

export function segmentClasses(selected: boolean) {
  return selected
    ? "flex-auto rounded-sm bg-highlight px-2 py-1.5 text-small font-semibold whitespace-nowrap text-on-highlight transition-colors sm:px-3"
    : "flex-auto rounded-sm px-2 py-1.5 text-small font-medium whitespace-nowrap text-ink-soft transition-colors hover:text-ink sm:px-3";
}
