"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";
import { patchGeneration } from "@/lib/generateClient";

export interface CardOutput {
  key: string;
  /** Empty while a remixed card is still being written. */
  generationId: string;
  text: string;
  platform: Platform;
  /** Replacement text streaming in (regenerate / remix); undefined when idle. */
  liveText?: string;
}

const CARD = "rounded-md border border-hairline bg-card p-4";
const PLATFORM_LABEL = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const ACTION_ROW = "mt-4 border-t border-dashed border-hairline pt-3";

function WritingRow() {
  return (
    <div className={ACTION_ROW}>
      <p className={PLATFORM_LABEL}>writing...</p>
    </div>
  );
}

function StreamingText({ text }: { text: string }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
      {text}
      <span
        aria-hidden
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent motion-safe:animate-pulse"
      />
    </p>
  );
}

/** A variation that's still being written: text grows, no actions yet. */
export function StreamingCard({ text, platform }: { text: string; platform: Platform }) {
  return (
    <div className={CARD}>
      <p className={PLATFORM_LABEL}>{platformRules[platform].label}</p>
      <StreamingText text={text} />
      <WritingRow />
    </div>
  );
}

/** Placeholder shown before the first words arrive. */
export function SkeletonCard() {
  return (
    <div className={CARD} aria-hidden>
      <div className="h-3 w-12 rounded-full bg-hairline motion-safe:animate-pulse" />
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-3 w-[92%] rounded-full bg-hairline motion-safe:animate-pulse" />
        <div className="h-3 w-[78%] rounded-full bg-hairline motion-safe:animate-pulse" />
        <div className="h-3 w-[55%] rounded-full bg-hairline motion-safe:animate-pulse" />
      </div>
      <div className={ACTION_ROW}>
        <div className="h-3 w-40 rounded-full bg-hairline motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

interface GenerateCardProps {
  output: CardOutput;
  /** Streams a replacement; resolves to an error message, or null. */
  onRegenerate: () => Promise<string | null>;
  /** Streams a version for another platform as a new card; resolves to an error message, or null. */
  onRemix: (platform: Platform) => Promise<string | null>;
}

export default function GenerateCard({ output, onRegenerate, onRemix }: GenerateCardProps) {
  const { generationId, text, platform, liveText } = output;
  const regenerating = liveText !== undefined;

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<-1 | 0 | 1>(0);
  const [actionError, setActionError] = useState("");
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixPlatform, setRemixPlatform] = useState<Platform>(
    PLATFORMS.find((p) => p !== platform) ?? platform
  );
  const [remixing, setRemixing] = useState(false);

  async function handleCopy() {
    setActionError("");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setActionError("Couldn't copy. Select the text and copy it by hand.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    setActionError("");
    const ok = await patchGeneration(generationId, {
      saved: true,
      chosen_output: text,
    });
    setSaving(false);
    if (ok) setSaved(true);
    else setActionError("Couldn't save that. Try again.");
  }

  async function handleFeedback(value: 1 | -1) {
    const previous = feedback;
    const next = feedback === value ? 0 : value;
    setFeedback(next);
    setActionError("");
    // A thumbs-up records which variation was liked, so the next generation's
    // "recent liked examples" uses this text rather than the row's first output.
    const ok = await patchGeneration(
      generationId,
      next === 1 ? { feedback: next, chosen_output: text } : { feedback: next }
    );
    if (!ok) {
      setFeedback(previous);
      setActionError("Couldn't record that. Try again.");
    }
  }

  async function handleRegenerate() {
    setActionError("");
    const error = await onRegenerate();
    if (error) setActionError(error);
  }

  async function handleRemix() {
    setRemixing(true);
    setActionError("");
    setRemixOpen(false); // the new card streams in below
    const error = await onRemix(remixPlatform);
    setRemixing(false);
    if (error) setActionError(error);
  }

  if (regenerating) {
    return (
      <div className={CARD}>
        <p className={PLATFORM_LABEL}>{platformRules[platform].label}</p>
        <StreamingText text={liveText} />
        <WritingRow />
      </div>
    );
  }

  return (
    <div className={CARD}>
      <p className={PLATFORM_LABEL}>{platformRules[platform].label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{text}</p>

      <div className={`${ACTION_ROW} flex flex-wrap items-center gap-4 text-sm`}>
        <button type="button" onClick={handleCopy} className="text-ink-soft">
          {copied ? "copied" : "Copy"}
        </button>
        <button type="button" onClick={handleRegenerate} className="text-ink-soft">
          Regenerate
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saved || saving}
          className="text-ink-soft disabled:opacity-60"
        >
          {saved ? "saved" : saving ? "saving..." : "Save to library"}
        </button>
        <button
          type="button"
          onClick={() => setRemixOpen((v) => !v)}
          className="text-ink-soft"
        >
          Remix for...
        </button>
        <span className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={() => handleFeedback(1)}
            aria-label="Good post"
            aria-pressed={feedback === 1}
            className={feedback === 1 ? "text-accent" : "text-ink-soft"}
          >
            <ThumbsUp size={16} strokeWidth={2} fill={feedback === 1 ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(-1)}
            aria-label="Not this"
            aria-pressed={feedback === -1}
            className={feedback === -1 ? "text-danger" : "text-ink-soft"}
          >
            <ThumbsDown size={16} strokeWidth={2} fill={feedback === -1 ? "currentColor" : "none"} />
          </button>
        </span>
      </div>

      {remixOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-hairline pt-3">
          <select
            value={remixPlatform}
            onChange={(e) => setRemixPlatform(e.target.value as Platform)}
            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-sm text-ink"
          >
            {PLATFORMS.filter((p) => p !== platform).map((p) => (
              <option key={p} value={p}>
                {platformRules[p].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRemix}
            disabled={remixing}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-card disabled:opacity-60"
          >
            {remixing ? "remixing..." : "Remix"}
          </button>
        </div>
      )}

      {actionError && <p className="mt-2 text-sm text-danger">{actionError}</p>}
    </div>
  );
}
