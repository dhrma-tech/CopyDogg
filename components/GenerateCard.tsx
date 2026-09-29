"use client";

import { useImperativeHandle, useMemo, useState, type Ref } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { PLATFORMS, SEND_LABELS, platformRules, sendLink, type Platform } from "@/lib/platformRules";
import { TWEAKS, type Tweak } from "@/lib/writingOptions";
import { patchGeneration } from "@/lib/generateClient";
import { wordDiff } from "@/lib/diff";
import { suggestWords } from "@/lib/wordSuggestions";
import { learnWords } from "@/app/actions";
import Button, { buttonClasses } from "@/components/ui/Button";
import { chipClasses } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Field";

export interface CardOutput {
  key: string;
  /** Empty while a remixed card is still being written. */
  generationId: string;
  text: string;
  platform: Platform;
  /** Replacement text streaming in (regenerate / tweak / remix); undefined when idle. */
  liveText?: string;
  /** The text this was rewritten from (Rewrite mode, tweaks), for "show changes". */
  compareTo?: string;
}

/** What keyboard shortcuts on /app can do to a card. */
export interface CardHandle {
  copy: () => void;
  edit: () => void;
  save: () => void;
  open: () => void;
  regenerate: () => void;
  tweak: (tweak: Tweak) => void;
}

const CARD = "rounded-md border border-hairline bg-card p-4 transition-colors";
// Keyboard-shortcut target: an ink edge instead of the hairline.
const ACTIVE_CARD = "rounded-md border border-ink bg-card p-4 transition-colors";
const PLATFORM_LABEL = "label";
const ACTION_ROW = "mt-4 border-t border-dashed border-hairline pt-3";
const TEXT_BUTTON = buttonClasses({ variant: "quiet", size: "sm" });
const SMALL_PILL = chipClasses(false, "sm");
const ICON_BASE = "grid h-9 w-9 place-items-center rounded-sm transition-colors";
const ICON_BUTTON = `${ICON_BASE} text-ink-soft hover:bg-highlight-soft hover:text-ink`;
const ICON_LIKED = `${ICON_BASE} bg-highlight text-on-highlight hover:bg-highlight-hover`;
const ICON_DISLIKED = `${ICON_BASE} text-danger hover:bg-highlight-soft`;

function WritingRow() {
  return (
    <div className={ACTION_ROW}>
      <p className={PLATFORM_LABEL}>writing...</p>
    </div>
  );
}

function StreamingText({ text }: { text: string }) {
  return (
    <p className="mt-2 whitespace-pre-wrap text-body text-ink">
      {text}
      <span
        aria-hidden
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-ink motion-safe:animate-pulse"
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
  ref?: Ref<CardHandle>;
  /** Target of keyboard shortcuts; shown with an ink border. */
  active?: boolean;
  /**
   * Start with the tweak / regenerate / remix row open. Other cards show a
   * "tweak & more" pill that opens it. Rows only ever open, never close on
   * their own, so nothing shifts under a finger mid-tap.
   */
  defaultExpanded?: boolean;
  /** 1-based position, shown as the shortcut number on desktop. */
  shortcutNumber?: number;
  onActivate?: () => void;
  /** Platforms offered under "Remix for..." (the current one is left out). */
  remixOptions: readonly Platform[];
  /** Streams a replacement; resolves to an error message, or null. */
  onRegenerate: () => Promise<string | null>;
  /** Streams an adjusted version of `text`; resolves to an error message, or null. */
  onTweak: (text: string, tweak: Tweak) => Promise<string | null>;
  /** Streams a version for another platform as a new card; resolves to an error message, or null. */
  onRemix: (platform: Platform) => Promise<string | null>;
  /** "Your words", so an edit only suggests names CopyDogg doesn't know yet. */
  knownWords?: string[];
  /** Called with the full list after words are added from a suggestion. */
  onWordsLearned?: (words: string[]) => void;
}

export default function GenerateCard({
  output,
  ref,
  active = false,
  defaultExpanded = true,
  shortcutNumber,
  onActivate,
  remixOptions,
  onRegenerate,
  onTweak,
  onRemix,
  knownWords = [],
  onWordsLearned,
}: GenerateCardProps) {
  // Names/acronyms spotted in the last hand edit, offered for "Your words".
  const [wordTips, setWordTips] = useState<string[]>([]);
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
  const [showChanges, setShowChanges] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const diff = useMemo(
    () => (showChanges && output.compareTo ? wordDiff(output.compareTo, text) : null),
    [showChanges, output.compareTo, text]
  );

  useImperativeHandle(ref, () => ({
    copy: () => void handleCopy(),
    edit: () => {
      setEditDraft(text);
      setEditing(true);
    },
    save: () => {
      if (!saved && !saving) void handleSave();
    },
    open: () => {
      if (!link) return;
      void copyText();
      window.open(link, "_blank", "noopener,noreferrer");
    },
    regenerate: () => void run(onRegenerate),
    tweak: (tweak) => void run(() => onTweak(text, tweak)),
  }));

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
      return;
    }
    setWordTips(suggestWords(previous, edited, knownWords));
  }

  async function addWord(word: string) {
    setWordTips((tips) => tips.filter((w) => w !== word));
    const result = await learnWords([word]).catch(() => ({ ok: false as const, error: "" }));
    if (result.ok) onWordsLearned?.(result.items);
    else setActionError("Couldn't add that to your words. Try again.");
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
    <div
      className={active ? ACTIVE_CARD : CARD}
      onClickCapture={onActivate}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) onActivate?.();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={PLATFORM_LABEL}>{platformRules[platform].label}</p>
        {shortcutNumber !== undefined && shortcutNumber <= 9 && (
          <kbd className="label hidden rounded-sm border border-control px-1.5 pointer-fine:inline">
            {shortcutNumber}
          </kbd>
        )}
      </div>

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
            className="w-full resize-y rounded-md border border-ink bg-card px-3 py-2 text-body text-ink ring-[3px] ring-highlight focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEditDone}>
              Done
            </Button>
            <button type="button" onClick={() => setEditing(false)} className={TEXT_BUTTON}>
              Cancel
            </button>
          </div>
        </div>
      ) : showChanges ? (
        diff ? (
          <p className="mt-2 whitespace-pre-wrap text-body text-ink" aria-label="Changes from your draft">
            {diff.map((part, i) =>
              part.type === "same" ? (
                <span key={i}>{part.text}</span>
              ) : part.type === "add" ? (
                <span key={i}>
                  <ins className="rounded-sm bg-accent-10 text-ink no-underline">{part.text}</ins>
                  {diff[i + 1]?.type === "del" && !/\s$/.test(part.text) && !/^\s/.test(diff[i + 1].text) && " "}
                </span>
              ) : (
                <span key={i}>
                  <del className="text-ink-50 decoration-danger">{part.text}</del>
                  {/* Keep a removed word and the word replacing it visibly apart. */}
                  {diff[i + 1]?.type === "add" && !/\s$/.test(part.text) && !/^\s/.test(diff[i + 1].text) && " "}
                </span>
              )
            )}
          </p>
        ) : (
          <p className="mt-2 text-small text-ink-soft">Too long to compare word by word.</p>
        )
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-body text-ink">{text}</p>
      )}

      <div className={`${ACTION_ROW} -ml-3.5 flex flex-wrap items-center gap-1`}>
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
            className="link mx-2 text-small"
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
        <span className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => handleFeedback(1)}
            aria-label="Good post"
            aria-pressed={feedback === 1}
            className={feedback === 1 ? ICON_LIKED : ICON_BUTTON}
          >
            <ThumbsUp size={16} strokeWidth={2} fill={feedback === 1 ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(-1)}
            aria-label="Not this"
            aria-pressed={feedback === -1}
            className={feedback === -1 ? ICON_DISLIKED : ICON_BUTTON}
          >
            <ThumbsDown size={16} strokeWidth={2} fill={feedback === -1 ? "currentColor" : "none"} />
          </button>
        </span>
      </div>

      {!expanded ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              onActivate?.();
            }}
            className={SMALL_PILL}
          >
            tweak &amp; more
          </button>
        </div>
      ) : (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {output.compareTo && (
          <button
            type="button"
            onClick={() => setShowChanges((v) => !v)}
            aria-pressed={showChanges}
            className={chipClasses(showChanges, "sm")}
          >
            {showChanges ? "hide changes" : "show changes"}
          </button>
        )}
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
      )}

      {expanded && remixOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-hairline pt-3">
          <Select
            value={remixPlatform}
            onChange={(e) => setRemixPlatform(e.target.value as Platform)}
            aria-label="Remix for which platform"
          >
            {remixChoices.map((p) => (
              <option key={p} value={p}>
                {platformRules[p].label}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={handleRemix}>
            Remix
          </Button>
        </div>
      )}

      {wordTips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-hairline pt-3" role="group" aria-label="Add to your words">
          <span className="text-small text-ink-soft">Add to your words?</span>
          {wordTips.map((w) => (
            <button key={w} type="button" onClick={() => void addWord(w)} className={SMALL_PILL}>
              + {w}
            </button>
          ))}
          <button type="button" onClick={() => setWordTips([])} className={TEXT_BUTTON}>
            No thanks
          </button>
        </div>
      )}

      {actionError && <p role="alert" className="mt-2 text-small text-danger">{actionError}</p>}
    </div>
  );
}
