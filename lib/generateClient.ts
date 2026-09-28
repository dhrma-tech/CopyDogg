import type { Platform, Structure } from "./platformRules";
import type { GenerateMode } from "./writingOptions";
import { splitPartialVariations } from "./variations";

/** Everything /api/generate accepts. Only platform and mode are always needed. */
export interface GenerateBody {
  /** The voice to write as; the server falls back to the active one. */
  personaId?: string;
  mode: GenerateMode;
  platform: Platform;
  promptInput: string;
  context?: string;
  situation?: string;
  scenario?: string;
  conversation?: boolean;
  toneOverride?: string;
  contactId?: string;
  language?: string;
  structure?: Structure;
  templateId?: string;
  tweak?: string;
  variationCount?: number;
}

export type GenerateResult =
  | { ok: true; generationId: string; outputs: string[] }
  /** `aborted`: the caller cancelled it (e.g. a newer request) — don't show an error. */
  | { ok: false; error: string; aborted?: boolean };

interface StreamOptions {
  /** Called with the variations written so far, each time more text arrives. */
  onPartial: (variations: string[]) => void;
  signal?: AbortSignal;
}

const NETWORK_ERROR =
  "Couldn't reach CopyDogg. Check your connection and try again.";

/**
 * Calls /api/generate and streams the posts in as they're written. Never
 * throws — network, parse and mid-stream failures come back as { ok: false }.
 */
export async function streamGenerate(
  body: GenerateBody,
  { onPartial, signal }: StreamOptions
): Promise<GenerateResult> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    // Validation errors arrive before streaming starts, as plain JSON.
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error ?? NETWORK_ERROR };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";
    let raw = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      const lines = buffered.split("\n");
      buffered = lines.pop() ?? ""; // keep the incomplete last line for next time
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === "delta") {
          raw += event.text;
          onPartial(splitPartialVariations(raw));
        } else if (event.type === "done") {
          return { ok: true, generationId: event.generationId, outputs: event.outputs };
        } else if (event.type === "error") {
          return { ok: false, error: event.error };
        }
      }
    }
    // Stream ended without a "done" line: the server stopped partway.
    return { ok: false, error: NETWORK_ERROR };
  } catch {
    if (signal?.aborted) return { ok: false, error: "", aborted: true };
    return { ok: false, error: NETWORK_ERROR };
  }
}

/** PATCHes a generation row; resolves false on any failure instead of throwing. */
export async function patchGeneration(id: string, body: object): Promise<boolean> {
  try {
    const res = await fetch(`/api/generations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
