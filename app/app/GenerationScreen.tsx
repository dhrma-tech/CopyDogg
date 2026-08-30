"use client";

import { useEffect, useState, type FormEvent } from "react";
import PersonaSelector from "@/components/PersonaSelector";
import PlatformPicker from "@/components/PlatformPicker";
import GenerateCard, { type CardOutput } from "@/components/GenerateCard";
import type { Platform } from "@/lib/platformRules";

const IDEA_PLACEHOLDERS = [
  "just shipped a side project and I'm proud of it",
  "hot take on remote work",
  "something that surprised me this week",
];

const TONE_CHIPS = ["funnier", "more serious", "more vulnerable"];
const LENGTH_CHIPS = ["short", "medium", "long"];
const HOOK_CHIPS = ["question hook", "bold claim hook", "story hook"];

interface GenerationScreenProps {
  personaId: string;
  personaName: string;
}

type Status = "idle" | "loading" | "error";

export default function GenerationScreen({
  personaId,
  personaName,
}: GenerationScreenProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [platform, setPlatform] = useState<Platform>("x");
  const [ideaInput, setIdeaInput] = useState("");
  const [submittedIdea, setSubmittedIdea] = useState("");
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [outputs, setOutputs] = useState<CardOutput[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % IDEA_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function toggle(
    value: string,
    current: string | null,
    setter: (v: string | null) => void
  ) {
    setter(current === value ? null : value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ideaInput.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const toneOverride = [tone, length, hook].filter(Boolean).join(", ");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personaId,
        platform,
        promptInput: ideaInput,
        toneOverride: toneOverride || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setSubmittedIdea(ideaInput);
    setOutputs(
      (data.outputs as string[]).map((text, i) => ({
        key: `${data.generationId}-${i}`,
        generationId: data.generationId as string,
        text,
        platform,
      }))
    );
    setStatus("idle");
  }

  function handleReplace(
    key: string,
    next: { generationId: string; text: string }
  ) {
    setOutputs((prev) =>
      prev.map((o) => (o.key === key ? { ...o, ...next } : o))
    );
  }

  function handleRemixed(next: {
    generationId: string;
    text: string;
    platform: Platform;
  }) {
    setOutputs((prev) => [
      ...prev,
      { key: `${next.generationId}-remix`, ...next },
    ]);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <PersonaSelector name={personaName} />

        <div className="mt-5">
          <PlatformPicker value={platform} onChange={setPlatform} />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <textarea
            value={ideaInput}
            onChange={(e) => setIdeaInput(e.target.value)}
            placeholder={IDEA_PLACEHOLDERS[placeholderIndex]}
            rows={3}
            className="resize-none rounded-md border border-hairline bg-card px-4 py-3 text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setOverridesOpen((v) => !v)}
            className="self-start text-xs uppercase tracking-[0.1em] text-ink-soft font-mono"
          >
            {overridesOpen ? "hide options" : "more options"}
          </button>

          {overridesOpen && (
            <div className="flex flex-col gap-2">
              <ChipRow options={TONE_CHIPS} value={tone} onToggle={(v) => toggle(v, tone, setTone)} />
              <ChipRow options={LENGTH_CHIPS} value={length} onToggle={(v) => toggle(v, length, setLength)} />
              <ChipRow options={HOOK_CHIPS} value={hook} onToggle={(v) => toggle(v, hook, setHook)} />
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !ideaInput.trim()}
            className="rounded-full bg-ink px-5 py-3 font-bold text-card disabled:opacity-60"
          >
            {status === "loading" ? "sniffing out your tone..." : "Generate posts"}
          </button>

          {status === "error" && (
            <p className="text-sm text-danger">{errorMessage}</p>
          )}
        </form>
      </div>

      {outputs.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {outputs.map((output) => (
            <GenerateCard
              key={output.key}
              output={output}
              personaId={personaId}
              promptInput={submittedIdea}
              onReplace={handleReplace}
              onRemixed={handleRemixed}
            />
          ))}
        </div>
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
