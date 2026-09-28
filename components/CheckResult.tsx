"use client";

export interface CheckResult {
  /** One plain sentence: how this will land. */
  verdict: string;
  traits: { label: string; level: "low" | "medium" | "high" }[];
  suggestions: string[];
}

const META = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";

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
      <p className="mt-2 text-base text-ink">{result.verdict}</p>

      {result.traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.traits.map((trait) => (
            <span
              key={trait.label}
              className={
                trait.level === "high"
                  ? "rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                  : "rounded-full border border-hairline px-3 py-1 text-xs font-medium text-ink-soft"
              }
            >
              {trait.label} · {trait.level}
            </span>
          ))}
        </div>
      )}

      {result.suggestions.length > 0 && (
        <ul className="mt-4 flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
          {result.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-dashed border-hairline pt-3">
        <button
          type="button"
          onClick={onRewrite}
          className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-card"
        >
          Rewrite it in my voice
        </button>
      </div>
    </div>
  );
}
