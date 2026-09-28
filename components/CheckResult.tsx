"use client";

import Button from "@/components/ui/Button";
import { chipClasses } from "@/components/ui/Chip";

export interface CheckResult {
  /** One plain sentence: how this will land. */
  verdict: string;
  traits: { label: string; level: "low" | "medium" | "high" }[];
  suggestions: string[];
}

const META = "label";

/** Tone check result: how the pasted text comes across, before sending it. */
export default function CheckResultCard({
  result,
  onRewrite,
}: {
  result: CheckResult;
  onRewrite: () => void;
}) {
  return (
    <div className="rounded-md border border-hairline bg-card p-4">
      <p className={META}>How it comes across</p>
      <p className="mt-2 font-display text-heading text-ink">{result.verdict}</p>

      {result.traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.traits.map((trait) => (
            <span
              key={trait.label}
              className={`${chipClasses(trait.level === "high", "sm")} pointer-events-none`}
            >
              {trait.label} · {trait.level}
            </span>
          ))}
        </div>
      )}

      {result.suggestions.length > 0 && (
        <ul className="mt-4 flex list-disc flex-col gap-1 pl-5 text-body text-ink marker:text-ink-soft">
          {result.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-dashed border-hairline pt-3">
        <Button size="sm" onClick={onRewrite}>
          Rewrite it in my voice
        </Button>
      </div>
    </div>
  );
}
