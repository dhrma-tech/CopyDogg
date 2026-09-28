/**
 * Claude returns variations separated by "---" (see the prompt in lib/claude.ts).
 * Shared by the server (final result) and the browser (live partials), so it
 * must not import anything server-only.
 */
export function splitVariations(raw: string): string[] {
  return raw
    .split("---")
    .map((variation) => variation.trim())
    .filter(Boolean);
}

/**
 * Same split, for text that's still arriving: hides a separator that has only
 * partly streamed in ("-" or "--" at the very end) so it doesn't flicker.
 */
export function splitPartialVariations(raw: string): string[] {
  return splitVariations(raw.replace(/\n?-{1,2}\s*$/, ""));
}
