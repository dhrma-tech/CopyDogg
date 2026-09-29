"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import PlatformPicker from "@/components/PlatformPicker";
import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { chipClasses } from "@/components/ui/Chip";
import { FIELD, Select } from "@/components/ui/Field";
import { SEGMENT_TRACK, segmentClasses } from "@/components/ui/Segmented";
import { DictationStatus, MicButton } from "@/components/MicButton";
import { useDictation } from "@/lib/useDictation";
import CheckResultCard, { type CheckResult } from "@/components/CheckResult";
import GenerateCard, {
  SkeletonCard,
  StreamingCard,
  type CardHandle,
  type CardOutput,
} from "@/components/GenerateCard";
import { useUndoToast } from "@/components/UndoToast";
import { PLATFORMS, isPlatform, platformRules, type Platform } from "@/lib/platformRules";
import {
  LANGUAGES,
  MODES,
  MODE_LABELS,
  SCENARIOS,
  SCENARIO_KEYS,
  SITUATIONS,
  isOneOf,
  type Mode,
  type ScenarioKey,
  type Tweak,
} from "@/lib/writingOptions";
import { streamGenerate, type GenerateBody } from "@/lib/generateClient";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  subscribeDraft,
  writeDraft,
} from "@/lib/draft";
import { saveIdea, selectVoice } from "@/app/actions";

const IDEA_PLACEHOLDERS = [
  "just shipped a side project and I'm proud of it",
  "tell my landlord the sink is leaking again",
  "hot take on remote work",
  "ask my manager for Friday off",
  "something that surprised me this week",
];

const CONTEXT_PLACEHOLDERS: Record<Exclude<Mode, "write">, string> = {
  reply: "Paste the message, comment or email you got",
  rewrite: "Paste your draft — messy is fine",
  notes: "Paste or dictate your meeting notes — rough is fine",
  check: "Paste something before you send it",
};
const CONVERSATION_PLACEHOLDER =
  "Paste the whole conversation, oldest first. Start your own lines with \"me:\"";

const SUBMIT_LABELS: Record<Mode, string> = {
  write: "Generate posts",
  reply: "Write replies",
  rewrite: "Rewrite it",
  notes: "Sum it up",
  check: "Check the tone",
};

const LOADING_LABELS: Record<Mode, string> = {
  write: "sniffing out your tone...",
  reply: "reading the room...",
  rewrite: "tidying it up...",
  notes: "pulling out the good bits...",
  check: "reading between the lines...",
};

const TONE_CHIPS = ["funnier", "more serious", "more vulnerable"];
const LENGTH_CHIPS = ["short", "medium", "long"];
const HOOK_CHIPS = ["question hook", "bold claim hook", "story hook"];

/** Second key after "t": which tweak to run. */
const TWEAK_KEYS: Record<string, Tweak> = {
  s: "shorter",
  w: "warmer",
  d: "more direct",
  f: "funnier",
};

const SHORTCUTS: [string, string][] = [
  ["1–9", "copy that version"],
  ["e", "edit"],
  ["s", "save"],
  ["o", "open in its app"],
  ["r", "regenerate"],
  ["t then s / w / d / f", "shorter / warmer / more direct / funnier"],
  ["/", "jump to the text box"],
  ["ctrl / ⌘ + enter", "write"],
  ["ctrl / ⌘ + z", "undo a tweak"],
  ["m", "start or stop dictating"],
  ["esc", "stop dictating"],
  ["?", "show or hide this list"],
];

const VARIATION_COUNT = 3;
const META = "label";
const PILL_ON = chipClasses(true, "sm");
const PILL_OFF = chipClasses(false, "sm");
// Small text-only controls in the row under the text box.
const QUIET = buttonClasses({ variant: "quiet", size: "sm" });

interface Voice {
  id: string;
  name: string;
  platforms: Platform[];
}

interface GenerationScreenProps {
  voices: Voice[];
  initialVoiceId: string;
  contacts: { id: string; name: string; relationship: string }[];
  templates: { id: string; name: string }[];
  voiceInput: boolean;
  /** BCP-47 tag for dictation; "" = the browser's language. */
  dictationLanguage: string;
  /** "Your words" from Profile. */
  words: string[];
}

type Status = "idle" | "loading" | "error";

export default function GenerationScreen({
  voices,
  initialVoiceId,
  contacts,
  templates,
  voiceInput,
  dictationLanguage,
  words,
}: GenerationScreenProps) {
  // Grows when a card's "Add to your words?" is used, so later edits don't re-suggest.
  const [knownWords, setKnownWords] = useState(words);
  const [voiceId, setVoiceId] = useState(initialVoiceId);
  const voice = voices.find((v) => v.id === voiceId) ?? voices[0];
  const platformOptions: readonly Platform[] =
    voice.platforms.length > 0 ? voice.platforms : PLATFORMS;

  // Restored draft: empty on the server, localStorage in the browser.
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  // null = untouched this visit, so the restored draft shows through.
  const [ideaInput, setIdeaInput] = useState<string | null>(null);
  const [contextInput, setContextInput] = useState<string | null>(null);
  const [platformChoice, setPlatformChoice] = useState<Platform | "all" | null>(null);
  const [modeInput, setModeInput] = useState<Mode | null>(null);
  const [languageInput, setLanguageInput] = useState<string | null>(null);
  const idea = ideaInput ?? draft.idea;
  const context = contextInput ?? draft.context;
  const mode: Mode = modeInput ?? (isOneOf(MODES, draft.mode) ? draft.mode : "write");
  const language = languageInput ?? (isOneOf(LANGUAGES, draft.language) ? draft.language : "");
  const choice = platformChoice ?? draft.platform;
  const platform: Platform =
    isPlatform(choice) && platformOptions.includes(choice) ? choice : platformOptions[0];
  // "All": one version for every platform this voice uses (Write mode only).
  const writeForAll = choice === "all" && mode === "write" && platformOptions.length > 1;

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [situation, setSituation] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const [conversation, setConversation] = useState(false);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [contactId, setContactId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [asStructure, setAsStructure] = useState(false);
  // Rewrite mode: tidy and format only, keep the wording.
  const [keepWords, setKeepWords] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaSaved, setIdeaSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [helpOpen, setHelpOpen] = useState(false);
  // Phrases that came from dictation. A request counts as dictated (Claude cleans up
  // fillers and do-overs) only while some of them are still in the text, so typing
  // over dictated text turns it off by itself.
  const dictatedPhrases = useRef<string[]>([]);
  // Which field dictation types into: the main box, or Reply's "what you want to say".
  const [micTarget, setMicTarget] = useState<"main" | "note">("main");

  const [outputs, setOutputs] = useState<CardOutput[]>([]);
  // Variations written so far for the in-flight request; null when not streaming.
  const [streaming, setStreaming] = useState<string[] | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // The request behind the cards on screen, reused by regenerate / remix / tweak.
  const lastRequest = useRef<GenerateBody | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const mainFieldRef = useRef<HTMLTextAreaElement>(null);
  const generateAbort = useRef<AbortController | null>(null);
  const cardAborts = useRef(new Set<AbortController>());
  const cardHandles = useRef(new Map<string, CardHandle>());
  const tempCount = useRef(0);
  const tweakKeyPending = useRef(false);
  const shortcutHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  const toast = useUndoToast();

  const structure = writeForAll ? undefined : platformRules[platform].structure;
  const usesContext = mode !== "write";
  const showChips = mode === "write" || mode === "reply";
  const readyCards = outputs.filter((o) => o.generationId && o.liveText === undefined);
  const activeCard = readyCards.find((o) => o.key === activeKey) ?? readyCards[0];
  // Tidy-only and notes have one right answer; threads/carousels are long (2 options).
  const tidyOnly = mode === "rewrite" && keepWords;
  const threadable = mode === "write" || (mode === "rewrite" && !keepWords);
  const expectedCount =
    mode === "notes" || tidyOnly ? 1 : asStructure && structure && threadable ? 2 : VARIATION_COUNT;

  const dictation = useDictation({
    lang: dictationLanguage,
    onFinal: (heard) => {
      dictatedPhrases.current = [...dictatedPhrases.current, heard].slice(-50);
      if (micTarget === "main" && usesContext) setContextInput((prev) => joinSpoken(prev ?? draft.context, heard));
      else setIdeaInput((prev) => joinSpoken(prev ?? draft.idea, heard));
    },
  });
  const micOn = voiceInput && dictation.supported;

  /** Points dictation at a field and starts it, or stops it if it's already on there. */
  function pressMic(target: "main" | "note") {
    if (dictation.listening && micTarget === target) {
      dictation.stop();
      return;
    }
    setMicTarget(target);
    dictation.start();
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % IDEA_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Desktop only: on phones, focusing would pop the keyboard over the page.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) mainFieldRef.current?.focus();
  }, [mode]);

  // Stop any in-flight Claude calls when leaving the page.
  useEffect(() => {
    const aborts = cardAborts.current;
    return () => {
      generateAbort.current?.abort();
      aborts.forEach((controller) => controller.abort());
    };
  }, []);

  // Save the draft shortly after typing stops.
  const touched =
    ideaInput !== null ||
    contextInput !== null ||
    platformChoice !== null ||
    modeInput !== null ||
    languageInput !== null;
  const draftPlatform = choice === "all" ? "all" : platform;
  useEffect(() => {
    if (!touched) return;
    const timeout = setTimeout(
      () => writeDraft({ idea, context, platform: draftPlatform, mode, language: language || null }),
      300
    );
    return () => clearTimeout(timeout);
  }, [touched, idea, context, draftPlatform, mode, language]);

  function handleShortcut(e: KeyboardEvent) {
    const typing = (e.target as HTMLElement | null)?.closest?.(
      "input, textarea, select, [contenteditable='true']"
    );
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
      if (toast.undo()) e.preventDefault();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "Escape") {
      setHelpOpen(false);
      tweakKeyPending.current = false;
      if (dictation.listening) dictation.stop();
      return;
    }
    if (e.key.toLowerCase() === "m" && micOn) {
      e.preventDefault();
      pressMic("main");
      return;
    }
    if (e.key === "?") {
      setHelpOpen((open) => !open);
      return;
    }
    if (e.key === "/") {
      e.preventDefault();
      mainFieldRef.current?.focus();
      return;
    }

    const handle = activeCard ? cardHandles.current.get(activeCard.key) : undefined;
    if (tweakKeyPending.current) {
      tweakKeyPending.current = false;
      const tweak = TWEAK_KEYS[e.key.toLowerCase()];
      if (tweak && handle) {
        e.preventDefault();
        handle.tweak(tweak);
      }
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const card = readyCards[Number(e.key) - 1];
      if (!card) return;
      setActiveKey(card.key);
      cardHandles.current.get(card.key)?.copy();
      return;
    }
    if (!handle) return;
    const actions: Record<string, () => void> = {
      e: handle.edit,
      s: handle.save,
      o: handle.open,
      r: handle.regenerate,
      t: () => {
        tweakKeyPending.current = true;
        setTimeout(() => (tweakKeyPending.current = false), 1500);
      },
    };
    const action = actions[e.key.toLowerCase()];
    if (action) {
      e.preventDefault();
      action();
    }
  }

  // Keyboard shortcuts. The listener is attached once; the handler is swapped
  // after each render so it always sees current state.
  useEffect(() => {
    shortcutHandler.current = handleShortcut;
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => shortcutHandler.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function toggle(value: string, current: string | null, setter: (v: string | null) => void) {
    setter(current === value ? null : value);
  }

  function switchMode(next: Mode) {
    setModeInput(next);
    setErrorMessage("");
    setStatus("idle");
    if (next !== "check") setCheckResult(null);
  }

  function switchVoice(id: string) {
    setVoiceId(id);
    // Remember it for next time; the switch itself doesn't wait on the server.
    void selectVoice(id).catch(() => {});
  }

  function toggleScenario(key: ScenarioKey) {
    const next = scenario === key ? null : key;
    setScenario(next);
    if (!next) return;
    // Jump to a format that fits (email for a refund...), if this voice uses one.
    const fits = SCENARIOS[next].formats as readonly string[];
    if (!fits.includes(platform) || writeForAll) {
      const better = platformOptions.find((p) => fits.includes(p));
      if (better) setPlatformChoice(better);
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (e.key === "Escape" && dictation.listening) {
      e.preventDefault();
      dictation.stop();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function buildRequest(): GenerateBody {
    const toneOverride = [tone, length, mode === "write" ? hook : null]
      .filter(Boolean)
      .join(", ");
    return {
      personaId: voice.id,
      mode: mode === "check" ? "write" : mode,
      platform,
      promptInput: idea.trim(),
      context: usesContext ? context.trim() : undefined,
      situation: showChips ? (situation ?? undefined) : undefined,
      scenario: showChips ? (scenario ?? undefined) : undefined,
      conversation: mode === "reply" && conversation ? true : undefined,
      toneOverride: toneOverride || undefined,
      contactId: contactId || undefined,
      language: language || undefined,
      structure: asStructure && structure && threadable ? structure : undefined,
      templateId: templateId || undefined,
      dictated: dictatedPhrases.current.some((ph) => idea.includes(ph) || context.includes(ph)) || undefined,
      keepWords: tidyOnly || undefined,
    };
  }

  async function runCheck(controller: AbortController) {
    setCheckResult(null);
    let result: CheckResult | { error: string };
    try {
      const res = await fetch("/api/tone-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: context.trim(), platform, contactId: contactId || undefined }),
        signal: controller.signal,
      });
      result = await res.json().catch(() => ({ error: "That came back garbled. Try again." }));
    } catch {
      if (controller.signal.aborted) return;
      result = { error: "Couldn't reach CopyDogg. Check your connection and try again." };
    }
    if ("error" in result) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }
    setCheckResult(result);
    setStatus("idle");
  }

  /** "All": one streamed version per platform, all at once, each in its own card. */
  async function runForAll(request: GenerateBody, controller: AbortController) {
    const run = ++tempCount.current;
    const entries: CardOutput[] = platformOptions.map((p) => ({
      key: `all-${run}-${p}`,
      generationId: "",
      text: "",
      platform: p,
      liveText: "",
    }));
    lastRequest.current = request;
    setStreaming(null);
    setOutputs(entries);

    const failures: string[] = [];
    await Promise.all(
      entries.map(async (entry) => {
        const result = await streamGenerate(
          { ...request, platform: entry.platform, variationCount: 1 },
          {
            onPartial: (v) => patchOutput(entry.key, { liveText: v[0] ?? "" }),
            signal: controller.signal,
          }
        );
        if (!result.ok) {
          if (!result.aborted) failures.push(`${platformRules[entry.platform].label}: ${result.error}`);
          setOutputs((prev) => prev.filter((o) => o.key !== entry.key));
          return;
        }
        setOutputs((prev) =>
          prev.map((o) =>
            o.key === entry.key
              ? {
                  key: `${result.generationId}-0`,
                  generationId: result.generationId,
                  text: result.outputs[0],
                  platform: entry.platform,
                }
              : o
          )
        );
      })
    );

    if (controller.signal.aborted) return; // a newer submit owns the screen now
    if (failures.length > 0) {
      setStatus("error");
      setErrorMessage(failures.join(" "));
    } else {
      setStatus("idle");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (usesContext ? !context.trim() : !idea.trim()) return;
    // Don't leave the mic open behind the results.
    if (dictation.listening) dictation.stop();

    // A newer submit replaces the one in flight.
    generateAbort.current?.abort();
    const controller = new AbortController();
    generateAbort.current = controller;

    setStatus("loading");
    setErrorMessage("");
    setActiveKey(null);

    if (mode === "check") {
      await runCheck(controller);
      return;
    }

    const request = buildRequest();
    if (writeForAll) {
      await runForAll(request, controller);
      return;
    }

    setStreaming([]);
    const result = await streamGenerate(
      { ...request, variationCount: expectedCount },
      { onPartial: setStreaming, signal: controller.signal }
    );

    if (!result.ok && result.aborted) return; // the newer submit owns the screen now

    setStreaming(null);
    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return; // previous results, if any, stay on screen
    }

    lastRequest.current = request;
    setOutputs(
      result.outputs.map((text, i) => ({
        key: `${result.generationId}-${i}`,
        generationId: result.generationId,
        text,
        platform,
        // Rewrites can show what changed from the pasted draft.
        compareTo: request.mode === "rewrite" ? request.context : undefined,
      }))
    );
    setStatus("idle");
  }

  async function handleSaveIdea() {
    if (!idea.trim()) return;
    setIdeaSaved("saving");
    const result = await saveIdea(idea).catch(() => ({ ok: false as const }));
    setIdeaSaved(result.ok ? "saved" : "idle");
    if (result.ok) setTimeout(() => setIdeaSaved("idle"), 2000);
    else {
      setStatus("error");
      setErrorMessage("Couldn't save that idea. Try again.");
    }
  }

  function patchOutput(key: string, patch: Partial<CardOutput>) {
    setOutputs((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }

  /** Streams one fresh version. Resolves to the result, an error message, or null when cancelled. */
  async function streamOne(
    overrides: Partial<GenerateBody>,
    onText: (text: string) => void
  ): Promise<{ generationId: string; text: string } | string | null> {
    if (!lastRequest.current) return null;
    const controller = new AbortController();
    cardAborts.current.add(controller);
    const result = await streamGenerate(
      { ...lastRequest.current, variationCount: 1, ...overrides },
      { onPartial: (v) => onText(v[0] ?? ""), signal: controller.signal }
    );
    cardAborts.current.delete(controller);
    if (!result.ok) return result.aborted ? null : result.error;
    return { generationId: result.generationId, text: result.outputs[0] };
  }

  /** Replaces a card's text with a streamed version (regenerate or tweak), with undo. */
  async function replaceCard(
    output: CardOutput,
    overrides: Partial<GenerateBody>,
    label: string,
    compareTo?: string
  ): Promise<string | null> {
    patchOutput(output.key, { liveText: "" });
    const result = await streamOne({ platform: output.platform, ...overrides }, (text) =>
      patchOutput(output.key, { liveText: text })
    );
    if (result === null || typeof result === "string") {
      patchOutput(output.key, { liveText: undefined }); // keep the old text on failure
      return result;
    }
    // New key remounts the card, so saved/feedback state from the old
    // generation doesn't carry over onto the new text.
    const newKey = `${result.generationId}-new`;
    setOutputs((prev) =>
      prev.map((o) =>
        o.key === output.key
          ? { ...o, ...result, liveText: undefined, key: newKey, compareTo: compareTo ?? o.compareTo }
          : o
      )
    );
    setActiveKey(newKey);
    const previous = { ...output, liveText: undefined };
    toast.show(label, {
      onUndo: () => {
        setOutputs((prev) => prev.map((o) => (o.key === newKey ? previous : o)));
        setActiveKey(previous.key);
      },
    });
    return null;
  }

  function handleTweak(output: CardOutput, text: string, tweak: Tweak) {
    return replaceCard(
      output,
      { mode: "tweak", context: text, tweak, structure: undefined, templateId: undefined },
      `Made it ${tweak}`,
      text
    );
  }

  async function handleRemix(platformFor: Platform): Promise<string | null> {
    const tempKey = `remix-${++tempCount.current}`;
    setOutputs((prev) => [
      ...prev,
      { key: tempKey, generationId: "", text: "", platform: platformFor, liveText: "" },
    ]);
    const result = await streamOne(
      {
        platform: platformFor,
        structure:
          platformRules[platformFor].structure === lastRequest.current?.structure
            ? lastRequest.current?.structure
            : undefined,
      },
      (text) => patchOutput(tempKey, { liveText: text })
    );
    if (result === null || typeof result === "string") {
      setOutputs((prev) => prev.filter((o) => o.key !== tempKey));
      return result;
    }
    setOutputs((prev) =>
      prev.map((o) =>
        o.key === tempKey ? { key: `${result.generationId}-remix`, platform: platformFor, ...result } : o
      )
    );
    return null;
  }

  function rewriteChecked() {
    switchMode("rewrite");
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  const canSubmit = usesContext ? !!context.trim() : !!idea.trim();
  const mainPlaceholder = !usesContext
    ? IDEA_PLACEHOLDERS[placeholderIndex]
    : mode === "reply" && conversation
      ? CONVERSATION_PLACEHOLDER
      : CONTEXT_PLACEHOLDERS[mode as Exclude<Mode, "write">];
  const submitLabel =
    status === "loading"
      ? LOADING_LABELS[mode]
      : writeForAll
        ? `Write for all ${platformOptions.length}`
        : mode === "write" && platformRules[platform].kind === "message"
          ? "Write drafts"
          : tidyOnly
            ? "Tidy it up"
            : SUBMIT_LABELS[mode];

  return (
    <div className="w-full max-w-2xl">
      <h1 className="mb-5 text-center font-display text-title text-ink">
        What are we writing today?
      </h1>

      <Card variant="main">
        {voices.length > 1 && (
          <div className="mb-3">
            <Select value={voice.id} onChange={(e) => switchVoice(e.target.value)} aria-label="Voice">
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className={SEGMENT_TRACK} role="group" aria-label="Mode">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={segmentClasses(mode === m, { accent: true })}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <PlatformPicker
            value={platform}
            onChange={setPlatformChoice}
            options={platformOptions}
            allSelected={writeForAll}
            onSelectAll={mode === "write" ? () => setPlatformChoice("all") : undefined}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <textarea
              ref={mainFieldRef}
              value={usesContext ? context : idea}
              onChange={(e) => {
                if (usesContext) setContextInput(e.target.value);
                else setIdeaInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={mainPlaceholder}
              rows={usesContext ? (conversation && mode === "reply" ? 6 : 4) : 3}
              aria-label={usesContext ? CONTEXT_PLACEHOLDERS[mode as Exclude<Mode, "write">] : "Your idea"}
              className={`${FIELD} resize-none pr-11`}
            />
            {micOn && (
              <MicButton
                dictation={dictation}
                active={micTarget === "main"}
                onPress={() => pressMic("main")}
                className="absolute right-2 top-2"
              />
            )}
          </div>

          {mode === "rewrite" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setKeepWords((v) => !v)}
                aria-pressed={keepWords}
                className={keepWords ? PILL_ON : PILL_OFF}
              >
                {keepWords ? "keep my words ✓" : "keep my words"}
              </button>
              <span className="text-small text-ink-soft">
                {keepWords
                  ? "Just tidies punctuation, paragraphs and lists."
                  : "Rewrites it to sound like you."}
              </span>
            </div>
          )}

          {mode === "notes" && (
            <p className="text-small text-ink-soft">
              {platformRules[platform].kind === "message"
                ? `You'll get a recap ${platformRules[platform].label === "Work chat" ? "update" : platformRules[platform].label.toLowerCase()} with a summary, decisions and next steps.`
                : "You'll get clean notes: summary, decisions and next steps. Pick Email or Work chat for a recap message."}
            </p>
          )}

          {mode === "reply" && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConversation((v) => !v)}
                aria-pressed={conversation}
                className={`self-start ${conversation ? PILL_ON : PILL_OFF}`}
              >
                {conversation ? "whole conversation ✓" : "it's a whole conversation"}
              </button>
              <div className="relative">
                <input
                  value={idea}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to say? (optional)"
                  aria-label="What you want to say"
                  className={`${FIELD} ${micOn ? "pr-12" : ""}`}
                />
                {micOn && (
                  <MicButton
                    dictation={dictation}
                    active={micTarget === "note"}
                    onPress={() => pressMic("note")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            </div>
          )}

          {micOn && <DictationStatus dictation={dictation} />}

          {showChips && (
            <div className="scroll-fade-x -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
              <div className="flex gap-2" role="group" aria-label="Situation">
                {SITUATIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s, situation, setSituation)}
                    aria-pressed={situation === s}
                    className={situation === s ? PILL_ON : PILL_OFF}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span aria-hidden className="h-5 w-px shrink-0 bg-control" />
              <div className="flex gap-2" role="group" aria-label="Who it's for">
                {SCENARIO_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleScenario(key)}
                    aria-pressed={scenario === key}
                    className={scenario === key ? PILL_ON : PILL_OFF}
                  >
                    {SCENARIOS[key].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {mode !== "check" ? (
              <button
                type="button"
                onClick={() => setOverridesOpen((v) => !v)}
                aria-expanded={overridesOpen}
                className={`-ml-3.5 whitespace-nowrap ${QUIET}`}
              >
                {overridesOpen ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                {overridesOpen ? "hide options" : "more options"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {mode === "write" && idea.trim() && (
                <button
                  type="button"
                  onClick={handleSaveIdea}
                  disabled={ideaSaved !== "idle"}
                  className={`whitespace-nowrap ${QUIET}`}
                >
                  <Bookmark size={13} strokeWidth={2.5} fill={ideaSaved === "saved" ? "currentColor" : "none"} />
                  {ideaSaved === "saved" ? "saved for later" : "save idea"}
                </button>
              )}
              {/* Keyboard help only makes sense with a keyboard: desktop, fine pointer. */}
              <span className="hidden sm:pointer-fine:inline-flex">
                <button
                  type="button"
                  onClick={() => setHelpOpen((v) => !v)}
                  aria-expanded={helpOpen}
                  className={`-mr-3.5 whitespace-nowrap ${QUIET}`}
                >
                  shortcuts ?
                </button>
              </span>
            </div>
          </div>

          {helpOpen && (
            <div className="border-t border-dashed border-control pt-3" aria-label="Keyboard shortcuts">
              <p className={META}>Keyboard shortcuts</p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
                {SHORTCUTS.filter(([keys]) => micOn || (keys !== "m" && keys !== "esc")).map(([keys, what]) => (
                  <div key={keys} className="contents">
                    <dt className="label text-ink">{keys}</dt>
                    <dd className="text-ink-soft">{what}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {overridesOpen && mode !== "check" && (
            <div className="flex flex-col gap-3 border-t border-dashed border-control pt-3">
              <ChipRow options={TONE_CHIPS} value={tone} onToggle={(v) => toggle(v, tone, setTone)} />
              <ChipRow options={LENGTH_CHIPS} value={length} onToggle={(v) => toggle(v, length, setLength)} />
              {mode === "write" && (
                <ChipRow options={HOOK_CHIPS} value={hook} onToggle={(v) => toggle(v, hook, setHook)} />
              )}
              {structure && threadable && (
                <ChipRow
                  options={[structure === "thread" ? "as a thread" : "as a carousel"]}
                  value={asStructure ? (structure === "thread" ? "as a thread" : "as a carousel") : null}
                  onToggle={() => setAsStructure((v) => !v)}
                />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                  <span className={META}>to</span>
                  {contacts.length > 0 ? (
                    <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
                      <option value="">anyone</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.relationship})
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Link href="/app/profile#people" className="link text-small">
                      add people
                    </Link>
                  )}
                </label>
                <label className="flex items-center gap-2">
                  <span className={META}>in</span>
                  <Select value={language} onChange={(e) => setLanguageInput(e.target.value)}>
                    <option value="">same language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex items-center gap-2">
                  <span className={META}>shape</span>
                  {templates.length > 0 ? (
                    <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                      <option value="">no template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Link href="/app/profile#templates" className="link text-small">
                      add templates
                    </Link>
                  )}
                </label>
              </div>
            </div>
          )}

          <Button type="submit" variant="accent" block disabled={status === "loading" || !canSubmit}>
            {submitLabel}
          </Button>

          {status === "error" && <p role="alert" className="text-small text-danger">{errorMessage}</p>}
        </form>
      </Card>

      {mode === "check" ? (
        status === "loading" ? (
          <div className="mt-6">
            <SkeletonCard />
          </div>
        ) : (
          checkResult && (
            <div className="mt-6">
              <CheckResultCard result={checkResult} onRewrite={rewriteChecked} />
            </div>
          )
        )
      ) : streaming !== null ? (
        <div className="mt-6 flex flex-col gap-4" aria-busy="true">
          {streaming.map((text, i) => (
            <StreamingCard key={i} text={text} platform={platform} />
          ))}
          {Array.from({ length: Math.max(0, expectedCount - streaming.length) }, (_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      ) : (
        outputs.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {outputs.map((output) =>
              output.generationId ? (
                <GenerateCard
                  key={output.key}
                  ref={(handle) => {
                    if (handle) cardHandles.current.set(output.key, handle);
                    else cardHandles.current.delete(output.key);
                  }}
                  output={output}
                  active={readyCards.length > 1 && activeCard?.key === output.key}
                  defaultExpanded={readyCards[0]?.key === output.key || activeCard?.key === output.key}
                  shortcutNumber={readyCards.findIndex((o) => o.key === output.key) + 1 || undefined}
                  onActivate={() => setActiveKey(output.key)}
                  remixOptions={platformOptions}
                  onRegenerate={() => replaceCard(output, {}, "Regenerated")}
                  onTweak={(text, tweak) => handleTweak(output, text, tweak)}
                  onRemix={handleRemix}
                  knownWords={knownWords}
                  onWordsLearned={setKnownWords}
                />
              ) : output.liveText ? (
                <StreamingCard key={output.key} text={output.liveText} platform={output.platform} />
              ) : (
                <SkeletonCard key={output.key} />
              )
            )}
          </div>
        )
      )}

      {toast.element}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onToggle,
}: {
  options: string[];
  value: string | null;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          aria-pressed={value === option}
          className={value === option ? PILL_ON : PILL_OFF}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/** Appends a dictated phrase with a single space, keeping what was typed. */
function joinSpoken(current: string, heard: string): string {
  if (!current) return heard;
  return /\s$/.test(current) ? current + heard : `${current} ${heard}`;
}
