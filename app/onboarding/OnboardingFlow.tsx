"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions";
import { onboardingPrompts, platformRules, type Platform } from "@/lib/platformRules";
import type { Sliders } from "@/lib/voicePreview";
import type { ExtractedVoice } from "@/lib/claude";
import ToneSliders from "@/components/ToneSliders";
import { PlatformMultiPicker } from "@/components/PlatformPicker";
import Card from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { FIELD } from "@/components/ui/Field";

interface PlatformAnswers {
  samples: [string, string, string];
  rewrite: string;
}

const EMPTY_ANSWERS: PlatformAnswers = { samples: ["", "", ""], rewrite: "" };

const DEFAULT_SLIDERS: Sliders = {
  formality: 50,
  humor: 50,
  bluntness: 50,
  warmth: 50,
  emojiDensity: 20,
};

const PRIMARY_BUTTON = `flex-1 ${buttonClasses({ variant: "accent" })}`;
const SECONDARY_BUTTON = buttonClasses({ variant: "secondary" });
const TEXTAREA = `${FIELD} resize-none`;
const META_LABEL = "label";
const HEADING = "font-display text-title text-ink";

function hasContent(a: PlatformAnswers | undefined) {
  return !!a && (a.rewrite.trim() !== "" || a.samples.some((s) => s.trim() !== ""));
}

/**
 * Stages: pick platforms → one page per platform (3 samples + rewrite a bland
 * post) → Claude reads it all → editable results → /app.
 */
export default function OnboardingFlow() {

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  // 0 = platform picker, 1..n = one page per chosen platform, n + 1 = results
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<Platform, PlatformAnswers>>>({});

  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [usedDefaults, setUsedDefaults] = useState(false);

  const [voiceDescription, setVoiceDescription] = useState("");
  const [sliders, setSliders] = useState<Sliders>(DEFAULT_SLIDERS);
  const [hashtagTolerance, setHashtagTolerance] = useState(20);
  const [platformVoices, setPlatformVoices] = useState<Partial<Record<Platform, string>>>({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const resultsStep = platforms.length + 1;
  const currentPlatform = step >= 1 && step <= platforms.length ? platforms[step - 1] : null;

  function updateAnswers(platform: Platform, next: Partial<PlatformAnswers>) {
    setAnswers((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? EMPTY_ANSWERS), ...next },
    }));
  }

  function goToDefaults() {
    setUsedDefaults(true);
    setReadError("");
    setVoiceDescription("");
    setSliders(DEFAULT_SLIDERS);
    setPlatformVoices({});
    setStep(resultsStep);
  }

  async function advanceFromPlatform(skipped?: Platform) {
    if (step < platforms.length) {
      setStep(step + 1);
      return;
    }

    const payload = platforms
      .filter((p) => p !== skipped && hasContent(answers[p]))
      .map((p) => ({
        platform: p,
        samples: answers[p]!.samples.filter((s) => s.trim()),
        rewrite: answers[p]!.rewrite,
      }));

    if (payload.length === 0) {
      goToDefaults();
      return;
    }

    setReading(true);
    setReadError("");
    let data: Partial<ExtractedVoice> & { error?: string };
    let ok = false;
    try {
      const res = await fetch("/api/voice-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: payload }),
      });
      data = await res.json().catch(() => ({}));
      ok = res.ok;
    } catch {
      data = { error: "Couldn't reach CopyDogg. Check your connection and try again." };
    }
    setReading(false);

    if (!ok || !data.voiceDescription || !data.tone) {
      setReadError(data.error ?? "Couldn't read your writing. Try again.");
      return;
    }

    setUsedDefaults(false);
    setVoiceDescription(data.voiceDescription);
    setSliders({
      formality: data.tone.formality,
      humor: data.tone.humor,
      bluntness: data.tone.bluntness,
      warmth: data.tone.warmth,
      emojiDensity: data.tone.emojiDensity,
    });
    setHashtagTolerance(data.tone.hashtagTolerance);
    setPlatformVoices(data.platformVoices ?? {});
    setStep(resultsStep);
  }

  function skipPlatform(platform: Platform) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
    // The cleared answers aren't visible until next render, so name the skip explicitly.
    void advanceFromPlatform(platform);
  }

  async function handleFinish() {
    setSaving(true);
    setSaveError("");

    const samplePosts = platforms.flatMap((p) => {
      const a = answers[p];
      if (!a) return [];
      return [...a.samples, a.rewrite].map((s) => s.trim()).filter(Boolean);
    });

    // On success the action redirects to /app, so only failures come back.
    let result: Awaited<ReturnType<typeof completeOnboarding>> | undefined;
    try {
      result = await completeOnboarding({
        voiceDescription,
        toneFormality: sliders.formality,
        toneHumor: sliders.humor,
        toneBluntness: sliders.bluntness,
        toneWarmth: sliders.warmth,
        emojiDensity: sliders.emojiDensity,
        hashtagTolerance,
        platforms,
        platformVoices: Object.fromEntries(platforms.map((p) => [p, platformVoices[p]])),
        samplePosts,
      });
    } catch {
      result = {
        ok: false,
        error: "Couldn't reach CopyDogg. Check that it's still running, then try again.",
      };
    }

    if (result && !result.ok) {
      setSaveError(result.error);
      setSaving(false);
    }
  }

  const totalSteps = platforms.length + 2;

  return (
    <div className="w-full max-w-xl">
      <p className={META_LABEL}>
        {step === 0 ? "Getting started" : `Step ${step + 1} of ${totalSteps}`}
      </p>

      <Card variant="main" className="mt-3">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className={HEADING}>
              Where do you post?
            </h1>
            <p className="text-body text-ink-soft">
              Pick every place you want CopyDogg to write for. You can change
              this later.
            </p>
            <PlatformMultiPicker value={platforms} onChange={setPlatforms} />
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={platforms.length === 0}
              className={`mt-2 ${PRIMARY_BUTTON}`}
            >
              Next
            </button>
          </div>
        )}

        {currentPlatform && (
          <PlatformStep
            key={currentPlatform}
            platform={currentPlatform}
            answers={answers[currentPlatform] ?? EMPTY_ANSWERS}
            onChange={(next) => updateAnswers(currentPlatform, next)}
            isLast={step === platforms.length}
            reading={reading}
            readError={readError}
            onBack={() => setStep(step - 1)}
            onNext={() => advanceFromPlatform()}
            onSkip={() => skipPlatform(currentPlatform)}
            onUseDefaults={goToDefaults}
          />
        )}

        {step === resultsStep && step > 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className={HEADING}>
                Here&rsquo;s how you sound
              </h1>
              <p className="mt-2 text-body text-ink-soft">
                {usedDefaults
                  ? "You skipped the samples, so these are starting defaults. Adjust them now, or fine-tune later in Profile."
                  : "This is what CopyDogg uses every time it writes for you. Change anything that's off."}
              </p>
            </div>

            <label className="flex flex-col gap-2">
              <span className={META_LABEL}>Your voice</span>
              <textarea
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                rows={5}
                placeholder="e.g. You write in short, direct lines and rarely use emoji."
                className={TEXTAREA}
              />
            </label>

            <div className="flex flex-col gap-3">
              <span className={META_LABEL}>Your tone</span>
              <ToneSliders
                sliders={sliders}
                onChange={(key, value) => setSliders((s) => ({ ...s, [key]: value }))}
              />
            </div>

            <div className="flex flex-col gap-4">
              <span className={META_LABEL}>Per platform</span>
              {platforms.map((p) => (
                <label key={p} className="flex flex-col gap-2">
                  <span className="text-small font-medium text-ink">{platformRules[p].label}</span>
                  <textarea
                    value={platformVoices[p] ?? ""}
                    onChange={(e) =>
                      setPlatformVoices((v) => ({ ...v, [p]: e.target.value }))
                    }
                    rows={2}
                    placeholder={`Anything different about how you sound on ${platformRules[p].label}?`}
                    className={TEXTAREA}
                  />
                </label>
              ))}
            </div>

            {saveError && <p role="alert" className="text-small text-danger">{saveError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(platforms.length)}
                disabled={saving}
                className={SECONDARY_BUTTON}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className={PRIMARY_BUTTON}
              >
                {saving ? "setting things up..." : "Start writing"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface PlatformStepProps {
  platform: Platform;
  answers: PlatformAnswers;
  onChange: (next: Partial<PlatformAnswers>) => void;
  isLast: boolean;
  reading: boolean;
  readError: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onUseDefaults: () => void;
}

function PlatformStep({
  platform,
  answers,
  onChange,
  isLast,
  reading,
  readError,
  onBack,
  onNext,
  onSkip,
  onUseDefaults,
}: PlatformStepProps) {
  const { label } = platformRules[platform];
  const { sampleNoun, blandPost } = onboardingPrompts[platform];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className={HEADING}>
          How you sound on {label}
        </h1>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-body font-medium text-ink">
          Paste up to 3 {sampleNoun} you&rsquo;ve written. Real ones, typos and all.
        </p>
        {answers.samples.map((sample, i) => (
          <textarea
            key={i}
            value={sample}
            onChange={(e) => {
              const samples = [...answers.samples] as PlatformAnswers["samples"];
              samples[i] = e.target.value;
              onChange({ samples });
            }}
            rows={2}
            placeholder={`Example ${i + 1}`}
            className={TEXTAREA}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-dashed border-control pt-5">
        <p className="text-body font-medium text-ink">Now rewrite this the way you&rsquo;d actually say it:</p>
        <p className="rounded-md bg-surface-warm px-4 py-3 text-body italic text-ink-soft">
          {blandPost}
        </p>
        <textarea
          value={answers.rewrite}
          onChange={(e) => onChange({ rewrite: e.target.value })}
          rows={3}
          placeholder="Your version"
          className={TEXTAREA}
        />
      </div>

      {readError && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-small text-danger">{readError}</p>
          <button type="button" onClick={onUseDefaults} className="link self-start text-small">
            Continue with defaults
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={reading} className={SECONDARY_BUTTON}>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={reading || !hasContent(answers)}
          className={PRIMARY_BUTTON}
        >
          {reading ? "sniffing out your tone..." : isLast ? "Read my voice" : "Next"}
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={reading}
        className={`self-center ${buttonClasses({ variant: "quiet", size: "sm" })}`}
      >
        Skip {label}
      </button>
    </div>
  );
}
