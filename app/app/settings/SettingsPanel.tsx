"use client";

import { useState } from "react";
import { lock, resetAllData, setVoiceInput } from "@/app/actions";
import BackupsSection from "./BackupsSection";
import DictationSettings from "./DictationSettings";
import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ThemeSwitch from "./ThemeSwitch";

interface SettingsPanelProps {
  generationCount: number;
  savedCount: number;
  dataFile: string;
  demoMode: boolean;
  passwordEnabled: boolean;
  voiceInput: boolean;
  dictationLanguage: string;
  backups: { name: string; date: string; bytes: number }[];
  backupFolder: string;
}

const META_LABEL = "label";
const SECONDARY_BUTTON = buttonClasses({ variant: "secondary" });

export default function SettingsPanel({
  generationCount,
  savedCount,
  dataFile,
  demoMode,
  passwordEnabled,
  voiceInput: initialVoiceInput,
  dictationLanguage,
  backups,
  backupFolder,
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
    <div className="w-full max-w-2xl">
      <h1 className="font-display text-title text-ink">Settings</h1>

      <Card variant="main" className="mt-5 flex flex-col gap-8">
        <section>
          <p className={META_LABEL}>Usage</p>
          <p className="mt-3 text-body text-ink-soft">
            {generationCount === 0
              ? "No posts generated yet."
              : `You've generated ${generationCount} post${generationCount === 1 ? "" : "s"} and saved ${savedCount}.`}
          </p>
          <p className="mt-2 text-body text-ink-soft">
            {demoMode
              ? "Demo mode: no Claude API key found, so posts are placeholders. Add ANTHROPIC_API_KEY to .env.local and restart."
              : "Posts are written with your own Claude API key, billed to your Anthropic account."}
          </p>
        </section>

        <section>
          <p className={META_LABEL}>Your data</p>
          <p className="mt-3 text-body text-ink-soft">
            Everything lives in one file on this machine:
          </p>
          <p className="mt-2 break-all rounded-md bg-paper px-3 py-2 font-mono text-label text-ink">
            {dataFile}
          </p>
          <a href="/api/export" download className={`mt-4 ${SECONDARY_BUTTON}`}>
            Export my data
          </a>
        </section>

        <BackupsSection backups={backups} folder={backupFolder} />

        <ThemeSwitch />

        <section>
          <p className={META_LABEL}>Voice input</p>
          <p className="mt-3 text-body text-ink-soft">
            Adds a mic button to the writing screen so you can say your idea
            instead of typing it.
          </p>
          <p className="mt-2 text-body text-ink">
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
              className="h-5 w-5 accent-ink"
            />
            <span className="text-body font-medium text-ink">
              Turn on voice input
            </span>
          </label>
          {voiceError && <p role="alert" className="mt-2 text-small text-danger">{voiceError}</p>}
          <DictationSettings enabled={voiceInput} initialLanguage={dictationLanguage} />
        </section>

        {passwordEnabled && (
          <section>
            <p className={META_LABEL}>Password</p>
            <p className="mt-3 text-body text-ink-soft">
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

        <section className="border-t border-dashed border-control pt-6">
          <p className="label text-danger">Start over</p>

          {resetStep === "idle" && (
            <button
              type="button"
              onClick={() => setResetStep("confirm")}
              className={`mt-2 -ml-3.5 ${buttonClasses({ variant: "danger", size: "sm" })}`}
            >
              Reset everything
            </button>
          )}

          {resetStep !== "idle" && (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-body text-ink">
                This deletes your voice profile, rules, topics, and every
                generated post from the data file. Export first if you want a
                copy — this can&rsquo;t be undone.
              </p>
              {resetError && <p role="alert" className="text-small text-danger">{resetError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setResetStep("idle")}
                  disabled={resetStep === "resetting"}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReset} disabled={resetStep === "resetting"}>
                  {resetStep === "resetting" ? "resetting..." : "Yes, reset everything"}
                </Button>
              </div>
            </div>
          )}
        </section>
      </Card>
    </div>
  );
}
