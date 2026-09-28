"use client";

import { useState } from "react";
import { lock, resetAllData, setVoiceInput } from "@/app/actions";

interface SettingsPanelProps {
  generationCount: number;
  savedCount: number;
  dataFile: string;
  demoMode: boolean;
  passwordEnabled: boolean;
  voiceInput: boolean;
}

const META_LABEL = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const SECONDARY_BUTTON =
  "rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink disabled:opacity-60";

export default function SettingsPanel({
  generationCount,
  savedCount,
  dataFile,
  demoMode,
  passwordEnabled,
  voiceInput: initialVoiceInput,
}: SettingsPanelProps) {
  const [voiceInput, setVoiceInputState] = useState(initialVoiceInput);
  const [voiceError, setVoiceError] = useState("");

  async function toggleVoiceInput() {
    const next = !voiceInput;
    setVoiceInputState(next);
    setVoiceError("");
    const result = await setVoiceInput(next).catch(() => ({ ok: false as const, error: "Couldn't reach CopyDogg." }));
    if (!result.ok) {
      setVoiceInputState(!next);
      setVoiceError(result.error);
    }
  }

  const [resetStep, setResetStep] = useState<"idle" | "confirm" | "resetting">("idle");
  const [resetError, setResetError] = useState("");
  const [locking, setLocking] = useState(false);

  async function handleReset() {
    setResetStep("resetting");
    setResetError("");
    // On success the action redirects to onboarding, so only failures come back.
    let result: Awaited<ReturnType<typeof resetAllData>> | undefined;
    try {
      result = await resetAllData();
    } catch {
      result = { ok: false, error: "Couldn't reach CopyDogg. Check that it's still running, then try again." };
    }
    if (result && !result.ok) {
      setResetError(result.error);
      setResetStep("confirm");
    }
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>

      <div className="mt-6 flex flex-col gap-8 rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <section>
          <p className={META_LABEL}>Usage</p>
          <p className="mt-3 text-sm text-ink-soft">
            {generationCount === 0
              ? "No posts generated yet."
              : `You've generated ${generationCount} post${generationCount === 1 ? "" : "s"} and saved ${savedCount}.`}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {demoMode
              ? "Demo mode: no Claude API key found, so posts are placeholders. Add ANTHROPIC_API_KEY to .env.local and restart."
              : "Posts are written with your own Claude API key, billed to your Anthropic account."}
          </p>
        </section>

        <section>
          <p className={META_LABEL}>Your data</p>
          <p className="mt-3 text-sm text-ink-soft">
            Everything lives in one file on this machine:
          </p>
          <p className="mt-2 break-all rounded-md border border-hairline bg-paper px-3 py-2 font-mono text-xs text-ink">
            {dataFile}
          </p>
          <a href="/api/export" download className={`mt-4 inline-block ${SECONDARY_BUTTON}`}>
            Export my data
          </a>
        </section>

        <section>
          <p className={META_LABEL}>Voice input</p>
          <p className="mt-3 text-sm text-ink-soft">
            Adds a mic button to the writing screen so you can say your idea
            instead of typing it.
          </p>
          <p className="mt-2 text-sm text-ink">
            Heads up: your browser does the listening, and most browsers
            (Chrome, Edge, Safari) send the audio to their own speech service
            — Google, Microsoft or Apple — to turn it into text. That&rsquo;s the
            one thing in CopyDogg that leaves your machine besides what goes to
            Claude.
          </p>
          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={voiceInput}
              onChange={toggleVoiceInput}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm font-medium text-ink">
              Turn on voice input
            </span>
          </label>
          {voiceError && <p className="mt-2 text-sm text-danger">{voiceError}</p>}
        </section>

        {passwordEnabled && (
          <section>
            <p className={META_LABEL}>Password</p>
            <p className="mt-3 text-sm text-ink-soft">
              This copy is password protected. Lock it to require the password
              again on this device.
            </p>
            <button
              type="button"
              onClick={() => {
                setLocking(true);
                void lock();
              }}
              disabled={locking}
              className={`mt-4 ${SECONDARY_BUTTON}`}
            >
              {locking ? "locking..." : "Lock CopyDogg"}
            </button>
          </section>
        )}

        <section className="border-t border-hairline pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-danger">
            Start over
          </p>

          {resetStep === "idle" && (
            <button
              type="button"
              onClick={() => setResetStep("confirm")}
              className="mt-3 text-sm font-medium text-danger underline"
            >
              Reset everything
            </button>
          )}

          {resetStep !== "idle" && (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-sm text-ink">
                This deletes your voice profile, rules, topics, and every
                generated post from the data file. Export first if you want a
                copy — this can&rsquo;t be undone.
              </p>
              {resetError && <p className="text-sm text-danger">{resetError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetStep("idle")}
                  disabled={resetStep === "resetting"}
                  className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetStep === "resetting"}
                  className="rounded-full bg-danger px-5 py-3 text-sm font-bold text-card disabled:opacity-60"
                >
                  {resetStep === "resetting" ? "resetting..." : "Yes, reset everything"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
