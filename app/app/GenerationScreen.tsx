"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import PlatformPicker from "@/components/PlatformPicker";
import PrimaryButton from "@/components/PrimaryButton";
import MicButton from "@/components/MicButton";
import CheckResultCard, { type CheckResult } from "@/components/CheckResult";
import GenerateCard, {
  SkeletonCard,
  StreamingCard,
  type CardOutput,
} from "@/components/GenerateCard";
import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";
import {
  LANGUAGES,
  MODES,
  MODE_LABELS,
  SITUATIONS,
  isOneOf,
  type Mode,
  type Tweak,
} from "@/lib/writingOptions";
import { streamGenerate, type GenerateBody } from "@/lib/generateClient";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  subscribeDraft,
  writeDraft,
} from "@/lib/draft";
import { saveIdea } from "@/app/actions";

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
  check: "Paste something before you send it",
};

const SUBMIT_LABELS: Record<Mode, string> = {
  write: "Generate posts",
  reply: "Write replies",
  rewrite: "Rewrite it",
  check: "Check the tone",
};

const LOADING_LABELS: Record<Mode, string> = {
  write: "sniffing out your tone...",
  reply: "reading the room...",
  rewrite: "tidying it up...",
  check: "reading between the lines...",
};

const TONE_CHIPS = ["funnier", "more serious", "more vulnerable"];
const LENGTH_CHIPS = ["short", "medium", "long"];
const HOOK_CHIPS = ["question hook", "bold claim hook", "story hook"];

const VARIATION_COUNT = 3;
const META = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const PILL_ON = "shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent";
const PILL_OFF =
  "shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink-soft";
const FIELD =
  "rounded-md border border-hairline bg-card px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-accent focus:ring-2 focus:ring-accent-soft";
const SELECT =
  "rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-medium text-ink outline-none focus:border-accent";

interface GenerationScreenProps {
  /** Platforms picked in onboarding; empty means all. */
  platforms: Platform[];
  contacts: { id: string; name: string; relationship: string }[];
  templates: { id: string; name: string }[];
  voiceInput: boolean;
}

type Status = "idle" | "loading" | "error";

export default function GenerationScreen({
  platforms,
  contacts,
  templates,
  voiceInput,
}: GenerationScreenProps) {
  const platformOptions: readonly Platform[] = platforms.length > 0 ? platforms : PLATFORMS;

  // Restored draft: empty on the server, localStorage in the browser.
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  // null = untouched this visit, so the restored draft shows through.
  const [ideaInput, setIdeaInput] = useState<string | null>(null);
  const [contextInput, setContextInput] = useState<string | null>(null);
  const [platformInput, setPlatformInput] = useState<Platform | null>(null);
  const [modeInput, setModeInput] = useState<Mode | null>(null);
  const [languageInput, setLanguageInput] = useState<string | null>(null);
  const idea = ideaInput ?? draft.idea;
  const context = contextInput ?? draft.context;
  const platform =
    platformInput ?? platformOptions.find((p) => p === draft.platform) ?? platformOptions[0];
  const mode: Mode = modeInput ?? (isOneOf(MODES, draft.mode) ? draft.mode : "write");
  const language = languageInput ?? (isOneOf(LANGUAGES, draft.language) ? draft.language : "");

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [situation, setSituation] = useState<string | null>(null);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [contactId, setContactId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [asStructure, setAsStructure] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaSaved, setIdeaSaved] = useState<"idle" | "saving" | "saved">("idle");

  const [outputs, setOutputs] = useState<CardOutput[]>([]);
  // Variations written so far for the in-flight request; null when not streaming.
  const [streaming, setStreaming] = useState<string[] | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  // The request behind the cards on screen, reused by regenerate / remix / tweak.
  const lastRequest = useRef<GenerateBody | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const mainFieldRef = useRef<HTMLTextAreaElement>(null);
  const generateAbort = useRef<AbortController | null>(null);
  const cardAborts = useRef(new Set<AbortController>());
  const remixCount = useRef(0);

  const structure = platformRules[platform].structure;
  const usesContext = mode !== "write";
  const showSituations = mode === "write" || mode === "reply";

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
    platformInput !== null ||
    modeInput !== null ||
    languageInput !== null;
  useEffect(() => {
    if (!touched) return;
    const timeout = setTimeout(
      () => writeDraft({ idea, context, platform, mode, language: language || null }),
      300
    );
    return () => clearTimeout(timeout);
  }, [touched, idea, context, platform, mode, language]);

  function toggle(value: string, current: string | null, setter: (v: string | null) => void) {
    setter(current === value ? null : value);
  }

  function switchMode(next: Mode) {
    setModeInput(next);
    setErrorMessage("");
    setStatus("idle");
    if (next !== "check") setCheckResult(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
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
      mode: mode === "check" ? "write" : mode,
      platform,
      promptInput: idea.trim(),
      context: usesContext ? context.trim() : undefined,
      situation: showSituations ? (situation ?? undefined) : undefined,
      toneOverride: toneOverride || undefined,
      contactId: contactId || undefined,
      language: language || undefined,
      structure: asStructure && structure ? structure : undefined,
      templateId: templateId || undefined,
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (usesContext ? !context.trim() : !idea.trim()) return;

    // A newer submit replaces the one in flight.
    generateAbort.current?.abort();
    const controller = new AbortController();
    generateAbort.current = controller;

    setStatus("loading");
    setErrorMessage("");

    if (mode === "check") {
      await runCheck(controller);
      return;
    }

    const request = buildRequest();
    setStreaming([]);
    const result = await streamGenerate(
      { ...request, variationCount: request.structure ? 2 : VARIATION_COUNT },
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

  /** Replaces a card's text with a streamed version (regenerate or tweak). */
  async function replaceCard(
    output: CardOutput,
    overrides: Partial<GenerateBody>
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
    setOutputs((prev) =>
      prev.map((o) =>
        o.key === output.key
          ? { ...o, ...result, liveText: undefined, key: `${result.generationId}-new` }
          : o
      )
    );
    return null;
  }

  function handleTweak(output: CardOutput, text: string, tweak: Tweak) {
    return replaceCard(output, {
      mode: "tweak",
      context: text,
      tweak,
      structure: undefined,
      templateId: undefined,
    });
  }

  async function handleRemix(platformFor: Platform): Promise<string | null> {
    const tempKey = `remix-${++remixCount.current}`;
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

  return (
    <div className="w-full max-w-xl">
      <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink sm:text-left sm:text-3xl">
        What are we writing today?
      </h1>

      <div className="rounded-lg border border-hairline bg-card p-5 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)] sm:p-6">
        <div className="flex gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Mode">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={
                mode === m
                  ? "flex-1 rounded-full bg-accent-soft py-1.5 text-sm font-medium text-accent"
                  : "flex-1 rounded-full py-1.5 text-sm font-medium text-ink-soft"
              }
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <PlatformPicker value={platform} onChange={setPlatformInput} options={platformOptions} />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <textarea
              ref={mainFieldRef}
              value={usesContext ? context : idea}
              onChange={(e) =>
                usesContext ? setContextInput(e.target.value) : setIdeaInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={usesContext ? CONTEXT_PLACEHOLDERS[mode as Exclude<Mode, "write">] : IDEA_PLACEHOLDERS[placeholderIndex]}
              rows={usesContext ? 4 : 3}
              aria-label={usesContext ? CONTEXT_PLACEHOLDERS[mode as Exclude<Mode, "write">] : "Your idea"}
              className={`w-full resize-none pr-11 ${FIELD}`}
            />
            {voiceInput && (
              <MicButton
                onText={(heard) =>
                  usesContext
                    ? setContextInput(`${context}${context && !context.endsWith(" ") ? " " : ""}${heard}`)
                    : setIdeaInput(`${idea}${idea && !idea.endsWith(" ") ? " " : ""}${heard}`)
                }
              />
            )}
          </div>

          {mode === "reply" && (
            <input
              value={idea}
              onChange={(e) => setIdeaInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to say? (optional)"
              aria-label="What you want to say"
              className={`text-sm ${FIELD}`}
            />
          )}

          {showSituations && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6" role="group" aria-label="Situation">
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
          )}

          <div className="flex items-center justify-between gap-3">
            {mode !== "check" ? (
              <button
                type="button"
                onClick={() => setOverridesOpen((v) => !v)}
                aria-expanded={overridesOpen}
                className={`flex items-center gap-1 whitespace-nowrap py-1 ${META}`}
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
                  className={`flex items-center gap-1 whitespace-nowrap py-1 ${META}`}
                >
                  <Bookmark size={13} strokeWidth={2.5} fill={ideaSaved === "saved" ? "currentColor" : "none"} />
                  {ideaSaved === "saved" ? "saved for later" : "save idea"}
                </button>
              )}
              <span className={`hidden whitespace-nowrap sm:pointer-fine:inline ${META}`}>ctrl / ⌘ + enter</span>
            </div>
          </div>

          {overridesOpen && mode !== "check" && (
            <div className="flex flex-col gap-3 rounded-md border border-dashed border-hairline p-3">
              <ChipRow options={TONE_CHIPS} value={tone} onToggle={(v) => toggle(v, tone, setTone)} />
              <ChipRow options={LENGTH_CHIPS} value={length} onToggle={(v) => toggle(v, length, setLength)} />
              {mode === "write" && (
                <ChipRow options={HOOK_CHIPS} value={hook} onToggle={(v) => toggle(v, hook, setHook)} />
              )}
              {structure && (
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
                    <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={SELECT}>
                      <option value="">anyone</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.relationship})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Link href="/app/profile#people" className="text-xs font-medium text-accent underline">
                      add people
                    </Link>
                  )}
                </label>
                <label className="flex items-center gap-2">
                  <span className={META}>in</span>
                  <select value={language} onChange={(e) => setLanguageInput(e.target.value)} className={SELECT}>
                    <option value="">same language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className={META}>shape</span>
                  {templates.length > 0 ? (
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={SELECT}>
                      <option value="">no template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Link href="/app/profile#templates" className="text-xs font-medium text-accent underline">
                      add templates
                    </Link>
                  )}
                </label>
              </div>
            </div>
          )}

          <PrimaryButton type="submit" disabled={status === "loading" || !canSubmit}>
            {status === "loading"
              ? LOADING_LABELS[mode]
              : mode === "write" && platformRules[platform].kind === "message"
                ? "Write drafts"
                : SUBMIT_LABELS[mode]}
          </PrimaryButton>

          {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
        </form>
      </div>

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
          {Array.from({ length: Math.max(0, (asStructure && structure ? 2 : VARIATION_COUNT) - streaming.length) }, (_, i) => (
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
                  output={output}
                  remixOptions={platformOptions}
                  onRegenerate={() => replaceCard(output, {})}
                  onTweak={(text, tweak) => handleTweak(output, text, tweak)}
                  onRemix={handleRemix}
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
