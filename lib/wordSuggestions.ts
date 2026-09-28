/**
 * Spots names, acronyms and brand-style words a person added when they edited
 * a result by hand ("priya" → "Priya", "okr" → "OKR"), so CopyDogg can offer
 * to add them to "Your words". Browser-safe, no dependencies.
 */

// Capitalized for grammar, not because they're names.
const IGNORE = new Set(["i", "i'm", "i've", "i'll", "i'd", "ok", "okay", "am", "pm", "tv"]);
const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}'’&.-]*[\p{L}\p{N}]|[\p{L}\p{N}]/gu;

export function suggestWords(before: string, after: string, known: string[], limit = 5): string[] {
  const seenBefore = new Set((before.match(TOKEN) ?? []).map((w) => w));
  const knownLower = new Set(known.map((w) => w.toLowerCase()));
  const found: string[] = [];

  for (const match of after.matchAll(TOKEN)) {
    const word = match[0];
    const lower = word.toLowerCase();
    // Already written exactly like this before the edit, or already known.
    if (seenBefore.has(word) || knownLower.has(lower) || IGNORE.has(lower)) continue;
    if (found.some((f) => f.toLowerCase() === lower)) continue;
    // Times and numbers ("5PM", "3rd") are never words-list material.
    if (/^\p{N}/u.test(word)) continue;

    const acronym = word.length >= 2 && /^[\p{Lu}\p{N}&.]+$/u.test(word) && /\p{Lu}/u.test(word);
    const mixedCase = /\p{Ll}\p{Lu}/u.test(word); // iPhone, GitHub
    // Capitalized mid-sentence: likely a name. At a sentence start it's just grammar.
    const preceding = after.slice(0, match.index).trimEnd();
    const sentenceStart = preceding === "" || /[.!?:\n]$/.test(preceding);
    const name = /^\p{Lu}\p{Ll}/u.test(word) && !sentenceStart;

    if (acronym || mixedCase || name) found.push(word.replace(/[.'’]+$/, ""));
    if (found.length >= limit) break;
  }
  return found;
}
