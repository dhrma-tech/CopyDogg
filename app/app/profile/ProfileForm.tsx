"use client";

import { useState } from "react";
import { saveProfile } from "@/app/actions";
import type { Persona } from "@/lib/store";
import type { Sliders } from "@/lib/voicePreview";
import ToneSliders from "@/components/ToneSliders";
import ChipEditor from "@/components/ChipEditor";
import PrimaryButton from "@/components/PrimaryButton";
import { PlatformMultiPicker } from "@/components/PlatformPicker";
import { platformRules, type Platform } from "@/lib/platformRules";

const RULE_SUGGESTIONS = [
  `never use "in today's world"`,
  `no corporate jargon ("leverage", "synergy")`,
  "always end with a question or a CTA",
  "no emoji unless it's 🔥",
  "keep sentences short",
  `never open with "I'm excited to announce"`,
];

interface ProfileFormProps {
  persona: Persona;
  initialTopics: string[];
}

type Status = "idle" | "saving" | "saved" | "error";

export default function ProfileForm({ persona, initialTopics }: ProfileFormProps) {
  const [voiceDescription, setVoiceDescription] = useState(
    persona.voiceDescription ?? ""
  );
  const [sliders, setSliders] = useState<Sliders>({
    formality: persona.toneFormality,
    humor: persona.toneHumor,
    bluntness: persona.toneBluntness,
    warmth: persona.toneWarmth,
    emojiDensity: persona.emojiDensity,
  });
  const [rules, setRules] = useState<string[]>(persona.rules);
  const [platforms, setPlatforms] = useState<Platform[]>(persona.platforms);
  const [platformVoices, setPlatformVoices] = useState(persona.platformVoices);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function setSlider(key: keyof Sliders, value: number) {
    setSliders((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage("");

    let result: Awaited<ReturnType<typeof saveProfile>>;
    try {
      result = await saveProfile({
        voiceDescription,
        toneFormality: sliders.formality,
        toneHumor: sliders.humor,
        toneBluntness: sliders.bluntness,
        toneWarmth: sliders.warmth,
        emojiDensity: sliders.emojiDensity,
        platforms,
        // Notes for deselected platforms are kept, so re-adding one restores it.
        platformVoices,
        rules,
        topics,
      });
    } catch {
      result = { ok: false, error: "Couldn't reach CopyDogg. Check that it's still running, then try again." };
    }

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }
    setStatus("saved");
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Your voice
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Edit your voice profile — this is what gets used on every generation.
      </p>

      <div className="mt-6 flex flex-col gap-6 rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <div>
          <p className="text-sm text-ink">Voice description</p>
          <textarea
            value={voiceDescription}
            onChange={(e) => setVoiceDescription(e.target.value)}
            rows={4}
            placeholder="You write in short punchy lines..."
            className="mt-2 w-full resize-none rounded-md border border-hairline bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">Platforms you post on</p>
          <PlatformMultiPicker value={platforms} onChange={setPlatforms} />
          {platforms.map((p) => (
            <label key={p} className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                On {platformRules[p].label}
              </span>
              <textarea
                value={platformVoices[p] ?? ""}
                onChange={(e) =>
                  setPlatformVoices((v) => ({ ...v, [p]: e.target.value }))
                }
                rows={2}
                placeholder={`Anything different about how you sound on ${platformRules[p].label}?`}
                className="w-full resize-none rounded-md border border-hairline bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
              />
            </label>
          ))}
        </div>

        <ToneSliders sliders={sliders} onChange={setSlider} />

        <ChipEditor
          label="Rules"
          items={rules}
          onAdd={(rule) => !rules.includes(rule) && setRules((r) => [...r, rule])}
          onRemove={(rule) => setRules((r) => r.filter((x) => x !== rule))}
          placeholder="Add your own rule"
          suggestions={RULE_SUGGESTIONS}
        />

        <ChipEditor
          label="Topics you post about"
          items={topics}
          onAdd={(topic) =>
            !topics.includes(topic) && setTopics((t) => [...t, topic])
          }
          onRemove={(topic) => setTopics((t) => t.filter((x) => x !== topic))}
          placeholder="indie hacking, fitness, parenting..."
        />

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        <div className="flex items-center gap-3">
          <PrimaryButton onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "saving..." : "Save changes"}
          </PrimaryButton>
          {status === "saved" && (
            <span className="text-sm text-accent">
              Saved.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
