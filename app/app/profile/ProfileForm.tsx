"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isDevMode } from "@/lib/devMode";
import type { Sliders } from "@/lib/voicePreview";
import ToneSliders from "@/components/ToneSliders";
import ChipEditor from "@/components/ChipEditor";
import PrimaryButton from "@/components/PrimaryButton";

const RULE_SUGGESTIONS = [
  `never use "in today's world"`,
  `no corporate jargon ("leverage", "synergy")`,
  "always end with a question or a CTA",
  "no emoji unless it's 🔥",
  "keep sentences short",
  `never open with "I'm excited to announce"`,
];

interface PersonaData {
  id: string;
  voiceDescription: string | null;
  toneFormality: number;
  toneHumor: number;
  toneBluntness: number;
  toneWarmth: number;
  emojiDensity: number;
  rules: string[];
}

interface Topic {
  id: string;
  label: string;
}

interface ProfileFormProps {
  persona: PersonaData;
  initialTopics: Topic[];
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
  const [topics, setTopics] = useState<string[]>(
    initialTopics.map((t) => t.label)
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function setSlider(key: keyof Sliders, value: number) {
    setSliders((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage("");

    if (isDevMode) {
      setTimeout(() => setStatus("saved"), 400);
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const { error: personaError } = await supabase
      .from("personas")
      .update({
        voice_description: voiceDescription || null,
        tone_formality: sliders.formality,
        tone_humor: sliders.humor,
        tone_bluntness: sliders.bluntness,
        tone_warmth: sliders.warmth,
        emoji_density: sliders.emojiDensity,
        rules,
      })
      .eq("id", persona.id);

    if (personaError) {
      setStatus("error");
      setErrorMessage("Couldn't save your profile. Try again.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const initialLabels = new Set(initialTopics.map((t) => t.label));
    const currentLabels = new Set(topics);
    const toAdd = topics.filter((label) => !initialLabels.has(label));
    const toRemoveIds = initialTopics
      .filter((t) => !currentLabels.has(t.label))
      .map((t) => t.id);

    if (user && toAdd.length > 0) {
      await supabase
        .from("topics")
        .insert(toAdd.map((label) => ({ user_id: user.id, label })));
    }
    if (toRemoveIds.length > 0) {
      await supabase.from("topics").delete().in("id", toRemoveIds);
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
              Saved{isDevMode ? " (test mode)" : ""}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
