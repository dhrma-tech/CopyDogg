"use client";

import { useState } from "react";
import { setDictationLanguage } from "@/app/actions";
import { Select } from "@/components/ui/Field";
import { useDictationSupported } from "@/lib/useDictation";
import { DICTATION_LANGUAGES } from "@/lib/writingOptions";
import { SettingRow } from "./SettingsLayout";

/** Language picker for dictation, and a plain note when this browser can't dictate. */
export default function DictationSettings({ initialLanguage }: { initialLanguage: string }) {
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
    <SettingRow
      title="Dictation language"
      description={
        supported ? (
          "The language you'll speak. Browsers can't detect it on their own."
        ) : (
          <>
            This browser can&rsquo;t dictate. Use Chrome, Edge or Safari for the mic (Firefox
            doesn&rsquo;t support speech recognition).
          </>
        )
      }
      control={
        <>
          {status === "saved" && (
            <span role="status" className="text-ui font-medium text-success">
              Saved.
            </span>
          )}
          <Select
            value={language}
            onChange={(e) => void change(e.target.value)}
            aria-label="Dictation language"
          >
            {DICTATION_LANGUAGES.map((l) => (
              <option key={l.tag} value={l.tag}>
                {l.label}
              </option>
            ))}
          </Select>
        </>
      }
    >
      {status === "error" && (
        <p role="alert" className="mt-2 text-ui text-ink">
          Couldn&rsquo;t save that. Try again.
        </p>
      )}
    </SettingRow>
  );
}
