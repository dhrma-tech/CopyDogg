"use client";

import { useState } from "react";
import { PLATFORMS, platformRules, type Platform } from "@/lib/platformRules";

export interface CardOutput {
  key: string;
  generationId: string;
  text: string;
  platform: Platform;
}

interface GenerateCardProps {
  output: CardOutput;
  personaId: string;
  promptInput: string;
  onReplace: (key: string, next: { generationId: string; text: string }) => void;
  onRemixed: (next: { generationId: string; text: string; platform: Platform }) => void;
}

async function patchGeneration(id: string, body: object) {
  return fetch(`/api/generations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function GenerateCard({
  output,
  personaId,
  promptInput,
  onReplace,
  onRemixed,
}: GenerateCardProps) {
  const { key, generationId, text, platform } = output;

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<-1 | 0 | 1>(0);
  const [regenerating, setRegenerating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixPlatform, setRemixPlatform] = useState<Platform>(
    PLATFORMS.find((p) => p !== platform) ?? platform
  );
  const [remixing, setRemixing] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    const res = await patchGeneration(generationId, {
      saved: true,
      chosen_output: text,
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  async function handleFeedback(value: 1 | -1) {
    const next = feedback === value ? 0 : value;
    setFeedback(next);
    await patchGeneration(generationId, { feedback: next });
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setActionError("");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personaId,
        platform,
        promptInput,
        variationCount: 1,
      }),
    });
    const data = await res.json();
    setRegenerating(false);
    if (!res.ok) {
      setActionError(data.error ?? "Couldn't regenerate. Try again.");
      return;
    }
    onReplace(key, { generationId: data.generationId, text: data.outputs[0] });
  }

  async function handleRemix() {
    setRemixing(true);
    setActionError("");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personaId,
        platform: remixPlatform,
        promptInput,
        variationCount: 1,
      }),
    });
    const data = await res.json();
    setRemixing(false);
    if (!res.ok) {
      setActionError(data.error ?? "Couldn't remix. Try again.");
      return;
    }
    onRemixed({
      generationId: data.generationId,
      text: data.outputs[0],
      platform: remixPlatform,
    });
    setRemixOpen(false);
  }

  return (
    <div className="rounded-md border border-hairline bg-card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
        {platformRules[platform].label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{text}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-dashed border-hairline pt-3 text-sm">
        <button type="button" onClick={handleCopy} className="text-ink-soft">
          {copied ? "copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-ink-soft disabled:opacity-60"
        >
          {regenerating ? "regenerating..." : "Regenerate"}
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
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => handleFeedback(1)}
            aria-label="Good post"
            className={feedback === 1 ? "text-accent" : "text-ink-soft"}
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(-1)}
            aria-label="Not this"
            className={feedback === -1 ? "text-danger" : "text-ink-soft"}
          >
            👎
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
