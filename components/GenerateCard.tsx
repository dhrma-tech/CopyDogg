"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { PLATFORMS, platformRules, sendLink, type Platform } from "@/lib/platformRules";
import { TWEAKS, type Tweak } from "@/lib/writingOptions";
import { patchGeneration } from "@/lib/generateClient";

export interface CardOutput {
  key: string;
  /** Empty while a remixed card is still being written. */
  generationId: string;
  text: string;
  platform: Platform;
  /** Replacement text streaming in (regenerate / tweak / remix); undefined when idle. */
  liveText?: string;
}

const CARD = "rounded-md border border-hairline bg-card p-4";
const PLATFORM_LABEL = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const ACTION_ROW = "mt-4 border-t border-dashed border-hairline pt-3";
const TEXT_BUTTON = "text-ink-soft hover:text-ink disabled:opacity-60";
const SMALL_PILL =
  "rounded-full border border-hairline px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink";

const SEND_LABELS: Partial<Record<Platform, string>> = {
  x: "Post on X",
  threads: "Post on Threads",
  linkedin: "Open LinkedIn",
  reddit: "Open Reddit",
  email: "Open in email",
  text: "Open in messages",
};

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
  /** Platforms offered under "Remix for..." (the current one is left out). */
  remixOptions: readonly Platform[];
  /** Streams a replacement; resolves to an error message, or null. */
  onRegenerate: () => Promise<string | null>;
  /** Streams an adjusted version of `text`; resolves to an error message, or null. */
  onTweak: (text: string, tweak: Tweak) => Promise<string | null>;
  /** Streams a version for another platform as a new card; resolves to an error message, or null. */
  onRemix: (platform: Platform) => Promise<string | null>;
}

export default function GenerateCard({
  output,
  remixOptions,
  onRegenerate,
  onTweak,
  onRemix,
}: GenerateCardProps) {
  const { generationId, platform, liveText } = output;
  const busy = liveText !== undefined;

  // The card's own copy of the text, so hand edits stick.
  const [text, setText] = useState(output.text);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(output.text);

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<-1 | 0 | 1>(0);
  const [actionError, setActionError] = useState("");
  const [remixOpen, setRemixOpen] = useState(false);
  const otherPlatforms = remixOptions.filter((p) => p !== platform);
  const remixChoices = otherPlatforms.length > 0 ? otherPlatforms : PLATFORMS.filter((p) => p !== platform);
  const [remixPlatform, setRemixPlatform] = useState<Platform>(remixChoices[0]);

  const link = sendLink(platform, text);

  async function copyText(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCopy() {
    setActionError("");
    if (!(await copyText())) {
      setActionError("Couldn't copy. Select the text and copy it by hand.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    setActionError("");
    const ok = await patchGeneration(generationId, { saved: true, chosen_output: text });
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

  async function handleEditDone() {
    const edited = editDraft.trim();
    setEditing(false);
    if (!edited || edited === text) return;
    const previous = text;
    setText(edited);
    setActionError("");
    // Hand edits are the clearest signal of how they actually write.
    const ok = await patchGeneration(generationId, { chosen_output: edited, edited: true });
    if (!ok) {
      setText(previous);
      setActionError("Couldn't keep that edit. Try again.");
    }
  }

  async function run(action: () => Promise<string | null>) {
    setActionError("");
    const error = await action();
    if (error) setActionError(error);
  }

  async function handleRemix() {
    setRemixOpen(false); // the new card streams in below
    await run(() => onRemix(remixPlatform));
  }

  if (busy) {
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

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleEditDone();
              if (e.key === "Escape") setEditing(false);
            }}
            rows={Math.min(12, Math.max(3, editDraft.split("\n").length + 1))}
            autoFocus
            aria-label="Edit this version"
            className="w-full resize-y rounded-md border border-accent bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <div className="flex gap-4 text-sm">
            <button type="button" onClick={handleEditDone} className="font-bold text-accent">
              Done
            </button>
            <button type="button" onClick={() => setEditing(false)} className={TEXT_BUTTON}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{text}</p>
      )}

      <div className={`${ACTION_ROW} flex flex-wrap items-center gap-x-4 gap-y-2 text-sm`}>
        <button type="button" onClick={handleCopy} className={TEXT_BUTTON}>
          {copied ? "copied" : "Copy"}
        </button>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            // Copy too: some apps ignore the prefilled text, so it's ready to paste.
            onClick={() => void copyText()}
            className="font-medium text-accent hover:underline"
          >
            {SEND_LABELS[platform]}
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setEditDraft(text);
            setEditing(true);
          }}
          className={TEXT_BUTTON}
        >
          Edit
        </button>
        <button type="button" onClick={handleSave} disabled={saved || saving} className={TEXT_BUTTON}>
          {saved ? "saved" : saving ? "saving..." : "Save"}
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {TWEAKS.map((tweak) => (
          <button
            key={tweak}
            type="button"
            onClick={() => run(() => onTweak(text, tweak))}
            className={SMALL_PILL}
          >
            {tweak}
          </button>
        ))}
        <button type="button" onClick={() => run(onRegenerate)} className={SMALL_PILL}>
          regenerate
        </button>
        <button
          type="button"
          onClick={() => setRemixOpen((v) => !v)}
          aria-expanded={remixOpen}
          className={SMALL_PILL}
        >
          remix for...
        </button>
      </div>

      {remixOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-hairline pt-3">
          <select
            value={remixPlatform}
            onChange={(e) => setRemixPlatform(e.target.value as Platform)}
            aria-label="Remix for which platform"
            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-sm text-ink"
          >
            {remixChoices.map((p) => (
              <option key={p} value={p}>
                {platformRules[p].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRemix}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-card"
          >
            Remix
          </button>
        </div>
      )}

      {actionError && <p className="mt-2 text-sm text-danger">{actionError}</p>}
    </div>
  );
}
