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
import { MIN_LEARNABLE_POSTS } from "@/lib/writingOptions";
import type { ExtractedVoice } from "@/lib/claude";

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
  /** Posts liked or hand-edited so far — what retune learns from. */
  learnableCount: number;
}

type RetuneState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; error: string }
  | { state: "proposed"; proposal: ExtractedVoice };

type Status = "idle" | "saving" | "saved" | "error";

export default function ProfileForm({ persona, initialTopics, learnableCount }: ProfileFormProps) {
  const [retune, setRetune] = useState<RetuneState>({ state: "idle" });
  const [name, setName] = useState(persona.name);
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

  /** `next` lets retune save values it just set, before state has re-rendered. */
  async function handleSave(next?: {
    voiceDescription: string;
    sliders: Sliders;
    platformVoices: Partial<Record<Platform, string>>;
  }) {
    setStatus("saving");
    setErrorMessage("");
    const v = next ?? { voiceDescription, sliders, platformVoices };

    let result: Awaited<ReturnType<typeof saveProfile>>;
    try {
      result = await saveProfile({
        personaId: persona.id,
        name,
        voiceDescription: v.voiceDescription,
        toneFormality: v.sliders.formality,
        toneHumor: v.sliders.humor,
        toneBluntness: v.sliders.bluntness,
        toneWarmth: v.sliders.warmth,
        emojiDensity: v.sliders.emojiDensity,
        platforms,
        // Notes for deselected platforms are kept, so re-adding one restores it.
        platformVoices: v.platformVoices,
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

  async function handleRetune() {
    setRetune({ state: "loading" });
    try {
      const res = await fetch("/api/voice-retune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.voiceDescription) {
        setRetune({ state: "error", error: data.error ?? "Couldn't retune. Try again." });
        return;
      }
      setRetune({ state: "proposed", proposal: data as ExtractedVoice });
    } catch {
      setRetune({ state: "error", error: "Couldn't reach CopyDogg. Check that it's still running." });
    }
  }

  async function keepRetune(proposal: ExtractedVoice) {
    const next = {
      voiceDescription: proposal.voiceDescription,
      sliders: {
        formality: proposal.tone.formality,
        humor: proposal.tone.humor,
        bluntness: proposal.tone.bluntness,
        warmth: proposal.tone.warmth,
        emojiDensity: proposal.tone.emojiDensity,
      },
      platformVoices: { ...platformVoices, ...proposal.platformVoices },
    };
    setVoiceDescription(next.voiceDescription);
    setSliders(next.sliders);
    setPlatformVoices(next.platformVoices);
    setRetune({ state: "idle" });
    await handleSave(next);
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {name.trim() || "Your voice"}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        This is what CopyDogg uses every time it writes as this voice.
      </p>

      <div className="mt-6 flex flex-col gap-6 rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <div className="rounded-md border border-dashed border-hairline p-4">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            Learn from your posts
          </p>
          {retune.state === "proposed" ? (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-sm text-ink-soft">Here&rsquo;s your voice, updated from what you liked and edited:</p>
              <p className="rounded-md bg-paper px-3 py-2 text-sm text-ink">
                {retune.proposal.voiceDescription}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => keepRetune(retune.proposal)}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-card"
                >
                  Keep this
                </button>
                <button
                  type="button"
                  onClick={() => setRetune({ state: "idle" })}
                  className="rounded-full border border-hairline px-4 py-2 text-sm font-bold text-ink-soft"
                >
                  Keep my current one
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-sm text-ink-soft">
                {learnableCount >= MIN_LEARNABLE_POSTS
                  ? `You've liked or edited ${learnableCount} posts. CopyDogg can refresh your voice from them.`
                  : `Like or edit ${MIN_LEARNABLE_POSTS - learnableCount} more post${MIN_LEARNABLE_POSTS - learnableCount === 1 ? "" : "s"} and CopyDogg can refresh your voice from them.`}
              </p>
              <button
                type="button"
                onClick={handleRetune}
                disabled={retune.state === "loading" || learnableCount < MIN_LEARNABLE_POSTS}
                className="self-start rounded-full border border-hairline px-4 py-2 text-sm font-bold text-ink disabled:opacity-60"
              >
                {retune.state === "loading" ? "re-reading your voice..." : "Retune my voice"}
              </button>
              {retune.state === "error" && <p className="text-sm text-danger">{retune.error}</p>}
            </div>
          )}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-ink">Voice name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Work me"
            className="w-full rounded-md border border-hairline bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
          />
        </label>

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
          <PrimaryButton onClick={() => handleSave()} disabled={status === "saving"}>
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
