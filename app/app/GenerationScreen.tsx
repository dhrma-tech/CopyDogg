"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PersonaSelector from "@/components/PersonaSelector";
import PlatformPicker from "@/components/PlatformPicker";
import PrimaryButton from "@/components/PrimaryButton";
import GenerateCard, {
  SkeletonCard,
  StreamingCard,
  type CardOutput,
} from "@/components/GenerateCard";
import { PLATFORMS, type Platform } from "@/lib/platformRules";
import { streamGenerate } from "@/lib/generateClient";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  subscribeDraft,
  writeDraft,
} from "@/lib/draft";

const IDEA_PLACEHOLDERS = [
  "just shipped a side project and I'm proud of it",
  "hot take on remote work",
  "something that surprised me this week",
];

const TONE_CHIPS = ["funnier", "more serious", "more vulnerable"];
const LENGTH_CHIPS = ["short", "medium", "long"];
const HOOK_CHIPS = ["question hook", "bold claim hook", "story hook"];

const VARIATION_COUNT = 3;

interface GenerationScreenProps {
  personaName: string;
  /** Platforms picked in onboarding; empty means all. */
  platforms: Platform[];
}

type Status = "idle" | "loading" | "error";

export default function GenerationScreen({
  personaName,
  platforms,
}: GenerationScreenProps) {
  const platformOptions: readonly Platform[] = platforms.length > 0 ? platforms : PLATFORMS;

  // Restored draft: empty on the server, localStorage in the browser.
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  // null = untouched this visit, so the restored draft shows through.
  const [ideaInput, setIdeaInput] = useState<string | null>(null);
  const [platformInput, setPlatformInput] = useState<Platform | null>(null);
  const idea = ideaInput ?? draft.idea;
  const restoredPlatform = platformOptions.find((p) => p === draft.platform);
  const platform = platformInput ?? restoredPlatform ?? platformOptions[0];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [ideaFocused, setIdeaFocused] = useState(false);
  const [submittedIdea, setSubmittedIdea] = useState("");
  const [submittedOverride, setSubmittedOverride] = useState<string>();
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [outputs, setOutputs] = useState<CardOutput[]>([]);
  // Variations written so far for the in-flight Generate; null when not streaming.
  const [streaming, setStreaming] = useState<string[] | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const generateAbort = useRef<AbortController | null>(null);
  const cardAborts = useRef(new Set<AbortController>());
  const remixCount = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % IDEA_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Desktop only: on phones, focusing would pop the keyboard over the page.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) ideaRef.current?.focus();
  }, []);

  // Stop any in-flight Claude calls when leaving the page.
  useEffect(() => {
    const aborts = cardAborts.current;
    return () => {
      generateAbort.current?.abort();
      aborts.forEach((controller) => controller.abort());
    };
  }, []);

  // Save the draft shortly after typing stops.
  useEffect(() => {
    if (ideaInput === null && platformInput === null) return;
    const timeout = setTimeout(() => writeDraft({ idea, platform }), 300);
    return () => clearTimeout(timeout);
  }, [idea, platform, ideaInput, platformInput]);

  function toggle(
    value: string,
    current: string | null,
    setter: (v: string | null) => void
  ) {
    setter(current === value ? null : value);
  }

  function handleIdeaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const promptInput = idea.trim();
    if (!promptInput) return;

    // A newer submit replaces the one in flight.
    generateAbort.current?.abort();
    const controller = new AbortController();
    generateAbort.current = controller;

    setStatus("loading");
    setErrorMessage("");
    setStreaming([]);

    const toneOverride =
      [tone, length, hook].filter(Boolean).join(", ") || undefined;

    const result = await streamGenerate(
      { platform, promptInput, toneOverride, variationCount: VARIATION_COUNT },
      { onPartial: setStreaming, signal: controller.signal }
    );

    if (!result.ok && result.aborted) return; // the newer submit owns the screen now

    setStreaming(null);
    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return; // previous results, if any, stay on screen
    }

    setSubmittedIdea(promptInput);
    setSubmittedOverride(toneOverride);
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

  function patchOutput(key: string, patch: Partial<CardOutput>) {
    setOutputs((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }

  /** Streams one fresh variation. Resolves to an error message, or null when it worked or was cancelled. */
  async function streamOne(
    platformFor: Platform,
    onText: (text: string) => void
  ): Promise<{ generationId: string; text: string } | string | null> {
    const controller = new AbortController();
    cardAborts.current.add(controller);
    const result = await streamGenerate(
      {
        platform: platformFor,
        promptInput: submittedIdea,
        toneOverride: submittedOverride,
        variationCount: 1,
      },
      { onPartial: (v) => onText(v[0] ?? ""), signal: controller.signal }
    );
    cardAborts.current.delete(controller);
    if (!result.ok) return result.aborted ? null : result.error;
    return { generationId: result.generationId, text: result.outputs[0] };
  }

  async function handleRegenerate(output: CardOutput): Promise<string | null> {
    patchOutput(output.key, { liveText: "" });
    const result = await streamOne(output.platform, (text) =>
      patchOutput(output.key, { liveText: text })
    );
    if (result === null || typeof result === "string") {
      patchOutput(output.key, { liveText: undefined }); // keep the old text on failure
      return result;
    }
    // New key remounts the card, so saved/feedback state from the old
    // generation doesn't carry over onto the regenerated text.
    setOutputs((prev) =>
      prev.map((o) =>
        o.key === output.key
          ? { ...o, ...result, liveText: undefined, key: `${result.generationId}-regen` }
          : o
      )
    );
    return null;
  }

  async function handleRemix(platformFor: Platform): Promise<string | null> {
    const tempKey = `remix-${++remixCount.current}`;
    setOutputs((prev) => [
      ...prev,
      { key: tempKey, generationId: "", text: "", platform: platformFor, liveText: "" },
    ]);
    const result = await streamOne(platformFor, (text) =>
      patchOutput(tempKey, { liveText: text })
    );
    if (result === null || typeof result === "string") {
      setOutputs((prev) => prev.filter((o) => o.key !== tempKey));
      return result;
    }
    setOutputs((prev) =>
      prev.map((o) =>
        o.key === tempKey
          ? { key: `${result.generationId}-remix`, platform: platformFor, ...result }
          : o
      )
    );
    return null;
  }

  return (
    <div className="w-full max-w-xl">
      <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink sm:text-left sm:text-3xl">
        What are we writing today?
      </h1>

      <div className="rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <PersonaSelector name={personaName} />

        <div className="mt-5">
          <PlatformPicker
            value={platform}
            onChange={setPlatformInput}
            options={platformOptions}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <textarea
            ref={ideaRef}
            value={idea}
            onChange={(e) => setIdeaInput(e.target.value)}
            onKeyDown={handleIdeaKeyDown}
            onFocus={() => setIdeaFocused(true)}
            onBlur={() => setIdeaFocused(false)}
            placeholder={IDEA_PLACEHOLDERS[placeholderIndex]}
            rows={3}
            required
            aria-label="Your idea"
            style={ideaFocused ? { borderColor: "var(--accent)" } : undefined}
            className="resize-none rounded-md border border-hairline bg-card px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft focus:ring-2 focus:ring-accent-soft"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOverridesOpen((v) => !v)}
              className="flex items-center gap-1 py-1 font-mono text-xs uppercase tracking-[0.1em] text-ink-soft"
            >
              {overridesOpen ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} />
              )}
              {overridesOpen ? "hide options" : "more options"}
            </button>
            <span className="hidden font-mono text-xs uppercase tracking-[0.1em] text-ink-soft pointer-fine:inline">
              ctrl / ⌘ + enter
            </span>
          </div>

          {overridesOpen && (
            <div className="flex flex-col gap-2">
              <ChipRow options={TONE_CHIPS} value={tone} onToggle={(v) => toggle(v, tone, setTone)} />
              <ChipRow options={LENGTH_CHIPS} value={length} onToggle={(v) => toggle(v, length, setLength)} />
              <ChipRow options={HOOK_CHIPS} value={hook} onToggle={(v) => toggle(v, hook, setHook)} />
            </div>
          )}

          <PrimaryButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? "sniffing out your tone..." : "Generate posts"}
          </PrimaryButton>

          {status === "error" && (
            <p className="text-sm text-danger">{errorMessage}</p>
          )}
        </form>
      </div>

      {streaming !== null ? (
        <div className="mt-6 flex flex-col gap-4" aria-busy="true">
          {streaming.map((text, i) => (
            <StreamingCard key={i} text={text} platform={platform} />
          ))}
          {Array.from({ length: Math.max(0, VARIATION_COUNT - streaming.length) }, (_, i) => (
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
                  onRegenerate={() => handleRegenerate(output)}
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
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={
              active
                ? "rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
                : "rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink-soft"
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
