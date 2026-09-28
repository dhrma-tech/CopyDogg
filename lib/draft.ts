/**
 * Keeps the half-typed idea and last platform on /app across refreshes.
 * Browser-only convenience: every storage access can throw (private mode,
 * blocked storage), and the app must work fine without it.
 */

const KEY = "copydogg:draft";

export interface Draft {
  idea: string;
  /** Pasted text for Reply / Rewrite / Check. */
  context: string;
  platform: string | null;
  mode: string | null;
  language: string | null;
}

const EMPTY: Draft = { idea: "", context: "", platform: null, mode: null, language: null };

// useSyncExternalStore needs a stable object for an unchanged value.
let cachedRaw: string | null = null;
let cachedDraft: Draft = EMPTY;

export function getDraftSnapshot(): Draft {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedDraft;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    cachedDraft = {
      idea: str(parsed?.idea) ?? "",
      context: str(parsed?.context) ?? "",
      platform: str(parsed?.platform),
      mode: str(parsed?.mode),
      language: str(parsed?.language),
    };
  } catch {
    cachedDraft = EMPTY;
  }
  return cachedDraft;
}

export function getServerDraftSnapshot(): Draft {
  return EMPTY;
}

/** Other tabs writing the draft; same-tab writes don't need to re-render. */
export function subscribeDraft(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function writeDraft(draft: Draft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable — the draft just won't survive a refresh.
  }
}

/** Puts an idea into the draft (e.g. "Use" on a saved idea) before opening /app. */
export function prefillIdea(idea: string): void {
  const current = getDraftSnapshot();
  writeDraft({ ...current, idea, mode: "write" });
}
