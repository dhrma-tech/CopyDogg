"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isDevMode } from "@/lib/devMode";
import type { Sliders } from "@/lib/voicePreview";
import ToneSliders from "@/components/ToneSliders";
import ChipEditor from "@/components/ChipEditor";

const RULE_SUGGESTIONS = [
  `never use "in today's world"`,
  `no corporate jargon ("leverage", "synergy")`,
  "always end with a question or a CTA",
  "no emoji unless it's 🔥",
  "keep sentences short",
  `never open with "I'm excited to announce"`,
];

export default function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [samples, setSamples] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [sliders, setSliders] = useState<Sliders>({
    formality: 50,
    humor: 50,
    bluntness: 50,
    warmth: 50,
    emojiDensity: 20,
  });

  const [rules, setRules] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  function setSlider(key: keyof Sliders, value: number) {
    setSliders((s) => ({ ...s, [key]: value }));
  }

  function addRule(rule: string) {
    if (!rules.includes(rule)) setRules((r) => [...r, rule]);
  }

  function addTopic(topic: string) {
    if (!topics.includes(topic)) setTopics((t) => [...t, topic]);
  }

  async function handleExtractVoice() {
    if (!samples.trim()) {
      setStep(2);
      return;
    }
    setExtracting(true);
    setExtractError("");
    const res = await fetch("/api/voice-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ samples }),
    });
    const data = await res.json();
    setExtracting(false);
    if (!res.ok) {
      setExtractError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setVoiceDescription(data.voiceDescription);
    setStep(2);
  }

  async function createPersona(defaultsOnly: boolean) {
    setSubmitting(true);
    setSubmitError("");

    if (isDevMode) {
      setTimeout(() => router.push("/app"), 400);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitError("You've been signed out — sign in again.");
      setSubmitting(false);
      return;
    }

    const { data: persona, error } = await supabase
      .from("personas")
      .insert(
        defaultsOnly
          ? { user_id: user.id, name: "Default", is_default: true }
          : {
              user_id: user.id,
              name: "Default",
              voice_description: voiceDescription || null,
              tone_formality: sliders.formality,
              tone_humor: sliders.humor,
              tone_bluntness: sliders.bluntness,
              tone_warmth: sliders.warmth,
              emoji_density: sliders.emojiDensity,
              rules,
              sample_posts: samples.trim() ? [samples.trim()] : [],
              is_default: true,
            }
      )
      .select("id")
      .single();

    if (error || !persona) {
      setSubmitError("Couldn't save your profile. Try again.");
      setSubmitting(false);
      return;
    }

    if (!defaultsOnly && topics.length > 0) {
      await supabase
        .from("topics")
        .insert(topics.map((label) => ({ user_id: user.id, label })));
    }

    router.push("/app");
  }

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
          Step {step} of 3
        </p>
        <button
          type="button"
          onClick={() => createPersona(true)}
          disabled={submitting}
          className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft underline disabled:opacity-60"
        >
          skip setup
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Paste your voice
            </h1>
            <p className="text-sm text-ink-soft">
              Paste a few things you&rsquo;ve written — tweets, captions, an
              email, anything. Optional, but it makes everything after this
              better.
            </p>
            <textarea
              value={samples}
              onChange={(e) => setSamples(e.target.value)}
              rows={8}
              placeholder="Paste your writing here..."
              className="resize-none rounded-md border border-hairline bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
            />
            {extractError && <p className="text-sm text-danger">{extractError}</p>}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink-soft"
              >
                Skip this step
              </button>
              <button
                type="button"
                onClick={handleExtractVoice}
                disabled={extracting}
                className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-bold text-card disabled:opacity-60"
              >
                {extracting ? "sniffing out your tone..." : "Read my voice"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Set your sliders
            </h1>

            {voiceDescription && (
              <div className="rounded-md border border-hairline bg-paper p-3">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                  Draft voice description
                </p>
                <textarea
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none bg-transparent text-sm text-ink focus:outline-none"
                />
              </div>
            )}

            <ToneSliders sliders={sliders} onChange={setSlider} />

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink-soft"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-bold text-card"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Your rules &amp; topics
            </h1>

            <ChipEditor
              label="Rules"
              items={rules}
              onAdd={addRule}
              onRemove={(rule) => setRules((r) => r.filter((x) => x !== rule))}
              placeholder="Add your own rule"
              suggestions={RULE_SUGGESTIONS}
            />

            <ChipEditor
              label="Topics you post about"
              items={topics}
              onAdd={addTopic}
              onRemove={(topic) => setTopics((t) => t.filter((x) => x !== topic))}
              placeholder="indie hacking, fitness, parenting..."
            />

            {submitError && <p className="text-sm text-danger">{submitError}</p>}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink-soft"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => createPersona(false)}
                disabled={submitting}
                className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-bold text-card disabled:opacity-60"
              >
                {submitting ? "setting things up..." : "Start writing"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
