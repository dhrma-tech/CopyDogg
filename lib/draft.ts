/**
 * Keeps the half-typed idea and last platform on /app across refreshes.
 * Browser-only convenience: every storage access can throw (private mode,
 * blocked storage), and the app must work fine without it.
 */

const KEY = "copydogg:draft";

export interface Draft {
  idea: string;
  platform: string | null;
}

const EMPTY: Draft = { idea: "", platform: null };

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
    cachedDraft = {
      idea: typeof parsed?.idea === "string" ? parsed.idea : "",
      platform: typeof parsed?.platform === "string" ? parsed.platform : null,
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
