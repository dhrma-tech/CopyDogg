"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import type { Persona } from "@/lib/store";
import type { Sliders } from "@/lib/voicePreview";
import ToneSliders from "@/components/ToneSliders";
import ChipEditor from "@/components/ChipEditor";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { FIELD } from "@/components/ui/Field";
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
  const router = useRouter();
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

  // Unsaved-changes tracking: compare the form to what was last saved.
  const snapshot = (v = { voiceDescription, sliders, platformVoices }) =>
    JSON.stringify([name, v.voiceDescription, v.sliders, rules, platforms, v.platformVoices, topics]);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot());
  const dirty = snapshot() !== savedSnapshot;

  // Closing the tab with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
    setSavedSnapshot(snapshot(v));
    setStatus("saved");
    // Voice names show elsewhere on the page (switcher); pull them fresh.
    router.refresh();
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
    <div className="w-full max-w-xl">
      <h1 className="font-display text-title text-ink">
        {name.trim() || "Your voice"}
      </h1>
      <p className="mt-2 text-body text-ink-soft">
        This is what CopyDogg uses every time it writes as this voice.
      </p>

      {/* Its own card, not a box nested inside the form. */}
      <Card variant="flat" className="mt-5">
          <p className="label">Learn from your posts</p>
          {retune.state === "proposed" ? (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-body text-ink-soft">Here&rsquo;s your voice, updated from what you liked and edited:</p>
              <p className="rounded-md bg-paper px-4 py-3 text-body text-ink">
                {retune.proposal.voiceDescription}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => keepRetune(retune.proposal)}>
                  Keep this
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRetune({ state: "idle" })}>
                  Keep my current one
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-body text-ink-soft">
                {learnableCount >= MIN_LEARNABLE_POSTS
                  ? `You've liked or edited ${learnableCount} posts. CopyDogg can refresh your voice from them.`
                  : `Like or edit ${MIN_LEARNABLE_POSTS - learnableCount} more post${MIN_LEARNABLE_POSTS - learnableCount === 1 ? "" : "s"} and CopyDogg can refresh your voice from them.`}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRetune}
                disabled={retune.state === "loading" || learnableCount < MIN_LEARNABLE_POSTS}
                className="self-start"
              >
                {retune.state === "loading" ? "re-reading your voice..." : "Retune my voice"}
              </Button>
              {retune.state === "error" && <p role="alert" className="text-small text-danger">{retune.error}</p>}
            </div>
          )}
      </Card>

      <Card variant="main" className="mt-4 flex flex-col gap-6">

        <label className="flex flex-col gap-2">
          <span className="text-small font-medium text-ink">Voice name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Work me"
            className={FIELD}
          />
        </label>

        <div>
          <p className="text-small font-medium text-ink">Voice description</p>
          <textarea
            value={voiceDescription}
            onChange={(e) => setVoiceDescription(e.target.value)}
            rows={4}
            placeholder="You write in short punchy lines..."
            className={`${FIELD} mt-2 resize-none`}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-small font-medium text-ink">Platforms you post on</p>
          <PlatformMultiPicker value={platforms} onChange={setPlatforms} />
          {platforms.map((p) => (
            <label key={p} className="flex flex-col gap-2">
              <span className="label">On {platformRules[p].label}</span>
              <textarea
                value={platformVoices[p] ?? ""}
                onChange={(e) =>
                  setPlatformVoices((v) => ({ ...v, [p]: e.target.value }))
                }
                rows={2}
                placeholder={`Anything different about how you sound on ${platformRules[p].label}?`}
                className={`${FIELD} resize-none`}
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

        {status === "error" && <p role="alert" className="text-small text-danger">{errorMessage}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={() => handleSave()} disabled={status === "saving"}>
            {status === "saving" ? "saving..." : "Save changes"}
          </Button>
          {status === "saved" && !dirty && (
            <span role="status" className="text-small font-medium text-success">
              Saved.
            </span>
          )}
        </div>
      </Card>

      {/* Keeps Save in reach while editing anywhere on this long page. */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-6">
          <div
            role="status"
            className="flex items-center gap-4 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-small text-paper motion-safe:animate-[toast-in_200ms_ease-out]"
          >
            <span>Unsaved changes</span>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={status === "saving"}
              className="min-h-9 rounded-full bg-highlight px-4 text-small font-semibold text-on-highlight transition-colors hover:bg-highlight-hover disabled:cursor-wait"
            >
              {status === "saving" ? "saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
