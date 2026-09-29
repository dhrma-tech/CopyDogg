"use client";

import { useState } from "react";
import { setDictationLanguage } from "@/app/actions";
import { useDictationSupported } from "@/lib/useDictation";
import { DICTATION_LANGUAGES } from "@/lib/writingOptions";

/** Language picker for dictation, and a plain note when this browser can't dictate. */
export default function DictationSettings({
  enabled,
  initialLanguage,
}: {
  enabled: boolean;
  initialLanguage: string;
}) {
  const supported = useDictationSupported();
  const [language, setLanguage] = useState(initialLanguage);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function change(tag: string) {
    const previous = language;
    setLanguage(tag);
    setStatus("idle");
    const result = await setDictationLanguage(tag).catch(() => ({ ok: false as const, error: "" }));
    if (result.ok) setStatus("saved");
    else {
      setLanguage(previous);
      setStatus("error");
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {!supported && (
        <p className="text-ui text-ink-65">
          This browser can&rsquo;t dictate. Use Chrome, Edge or Safari for the mic (Firefox
          doesn&rsquo;t support speech recognition).
        </p>
      )}
      <label className="flex flex-wrap items-center gap-3">
        <span className={`text-body font-medium ${enabled ? "text-ink" : "text-ink-40"}`}>Dictation language</span>
        <select
          value={language}
          onChange={(e) => void change(e.target.value)}
          disabled={!enabled}
          className="h-11 max-w-full rounded-lg border border-ink-50 bg-surface px-3 text-body text-ink transition-[border-color,box-shadow] hover:border-ink focus:border-ink focus:shadow-ring focus:outline-none disabled:cursor-not-allowed disabled:text-ink-40"
        >
          {DICTATION_LANGUAGES.map((l) => (
            <option key={l.tag} value={l.tag}>
              {l.label}
            </option>
          ))}
        </select>
        {status === "saved" && (
          <span role="status" className="text-ui font-medium text-success">
            Saved.
          </span>
        )}
      </label>
      {status === "error" && (
        <p role="alert" className="text-ui text-ink">
          Couldn&rsquo;t save that. Try again.
        </p>
      )}
      <p className="text-ui text-ink-65">
        Pick the language you&rsquo;ll speak: the browser can&rsquo;t detect it by itself.
        CopyDogg can still write the result in another language (&ldquo;more options&rdquo; on the
        writing screen).
      </p>
    </div>
  );
}
