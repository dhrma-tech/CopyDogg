"use client";

import { useState } from "react";

interface GenerateCardProps {
  generationId: string;
  text: string;
}

export default function GenerateCard({ generationId, text }: GenerateCardProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/generations/${generationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: true }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="rounded-md border border-hairline bg-card p-4">
      <p className="whitespace-pre-wrap text-sm text-ink">{text}</p>
      <div className="mt-4 flex gap-4 border-t border-dashed border-hairline pt-3 text-sm">
        <button type="button" onClick={handleCopy} className="text-ink-soft">
          {copied ? "copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saved || saving}
          className="text-ink-soft disabled:opacity-60"
        >
          {saved ? "saved" : saving ? "saving..." : "Save to library"}
        </button>
      </div>
    </div>
  );
}
