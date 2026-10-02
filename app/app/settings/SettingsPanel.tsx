"use client";

import { useState } from "react";
import { lock, resetAllData, setVoiceInput } from "@/app/actions";
import BackupsSection from "./BackupsSection";
import DictationSettings from "./DictationSettings";
import Button, { buttonClasses } from "@/components/ui/Button";
import ThemeSwitch from "./ThemeSwitch";
import { SettingRow, SettingsGroup, Switch } from "./SettingsLayout";

interface SettingsPanelProps {
  generationCount: number;
  savedCount: number;
  dataFile: string;
  demoMode: boolean;
  /** "Claude" or "Gemini": whichever key the app is using. */
  providerLabel: string;
  passwordEnabled: boolean;
  voiceInput: boolean;
  dictationLanguage: string;
  backups: { name: string; date: string; bytes: number }[];
  backupFolder: string;
}

const SECONDARY_SM = buttonClasses({ variant: "secondary", size: "sm" });

export default function SettingsPanel({
  generationCount,
  savedCount,
  dataFile,
  demoMode,
  providerLabel,
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
      <h1 className="font-display text-h3 text-ink">Settings</h1>
      <p className="mt-1 text-ui text-ink-65">
        How CopyDogg writes, looks and listens, and where your data lives.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <SettingsGroup title="Writing">
          <SettingRow
            title="AI provider"
            description={
              demoMode ? (
                <>
                  No API key found, so posts are placeholders. Add{" "}
                  <code className="font-mono text-micro text-ink">ANTHROPIC_API_KEY</code> or{" "}
                  <code className="font-mono text-micro text-ink">GEMINI_API_KEY</code> to{" "}
                  <code className="font-mono text-micro text-ink">.env.local</code> and restart.
                </>
              ) : (
                "Uses your own API key. Usage is billed to that key's account."
              )
            }
            inline
            control={
              <span className="rounded-pill bg-surface-press px-3 py-1.5 text-ui font-medium text-ink">
                {demoMode ? "Demo mode" : providerLabel}
              </span>
            }
          />
          <SettingRow
            title="Posts"
            description="Everything you've written with CopyDogg so far."
            control={
              <span className="flex items-baseline gap-4 text-ui text-ink-65">
                <span>
                  <span className="font-display text-h3 text-ink">{generationCount}</span> written
                </span>
                <span>
                  <span className="font-display text-h3 text-ink">{savedCount}</span> saved
                </span>
              </span>
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <ThemeSwitch />
        </SettingsGroup>

        <SettingsGroup
          title="Voice input"
          note="CopyDogg can still write the result in another language (“more options” on the writing screen)."
        >
          <SettingRow
            title="Mic on the writing screen"
            description="Say your idea instead of typing it."
            inline
            control={<Switch checked={voiceInput} onChange={toggleVoiceInput} label="Voice input" />}
          >
            <p className="mt-3 rounded-md bg-surface-warm px-4 py-3 text-ui text-ink">
              Heads up: your browser does the listening, and most browsers (Chrome, Edge, Safari)
              send the audio to their own speech service (Google, Microsoft or Apple) to turn it
              into text. That&rsquo;s the one thing in CopyDogg that leaves your machine besides
              what goes to {demoMode ? "the AI provider" : providerLabel}.
            </p>
            {voiceError && (
              <p role="alert" className="mt-2 text-ui text-ink">
                {voiceError}
              </p>
            )}
          </SettingRow>
          {voiceInput && <DictationSettings initialLanguage={dictationLanguage} />}
        </SettingsGroup>

        <SettingsGroup title="Your data">
          <SettingRow
            title="Data file"
            description={
              <>
                Everything lives in one file on this machine.
                <span className="mt-1 block break-all font-mono text-micro text-ink">{dataFile}</span>
              </>
            }
            control={
              <a href="/api/export" download className={SECONDARY_SM}>
                Export my data
              </a>
            }
          />
          <BackupsSection backups={backups} folder={backupFolder} />
        </SettingsGroup>

        {passwordEnabled && (
          <SettingsGroup title="Password">
            <SettingRow
              title="Lock CopyDogg"
              description="Ask for the password again on this device."
              control={
                <button
                  type="button"
                  onClick={() => {
                    setLocking(true);
                    void lock();
                  }}
                  disabled={locking}
                  className={SECONDARY_SM}
                >
                  {locking ? "locking..." : "Lock now"}
                </button>
              }
            />
          </SettingsGroup>
        )}

        <SettingsGroup title="Start over">
          <SettingRow
            title="Reset everything"
            description="Delete your voice profile, rules, topics and every post. Export first if you want a copy."
            control={
              resetStep === "idle" && (
                <button type="button" onClick={() => setResetStep("confirm")} className={SECONDARY_SM}>
                  Reset everything
                </button>
              )
            }
          >
            {resetStep !== "idle" && (
              <div className="mt-3 flex flex-col gap-3 rounded-md bg-surface-warm px-4 py-3">
                <p className="text-ui font-medium text-ink">
                  This can&rsquo;t be undone. Everything in your data file will be gone.
                </p>
                {resetError && (
                  <p role="alert" className="text-ui text-ink">
                    {resetError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResetStep("idle")}
                    disabled={resetStep === "resetting"}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReset}
                    disabled={resetStep === "resetting"}
                  >
                    {resetStep === "resetting" ? "resetting..." : "Yes, reset everything"}
                  </Button>
                </div>
              </div>
            )}
          </SettingRow>
        </SettingsGroup>
      </div>
    </div>
  );
}
