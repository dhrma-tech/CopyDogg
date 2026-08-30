"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isDevMode } from "@/lib/devMode";
import PrimaryButton from "@/components/PrimaryButton";

interface SettingsPanelProps {
  email: string;
  initialDisplayName: string;
  generationCount: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPanel({
  email,
  initialDisplayName,
  generationCount,
}: SettingsPanelProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameStatus, setNameStatus] = useState<SaveStatus>("idle");

  const [signingOut, setSigningOut] = useState(false);

  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">(
    "idle"
  );
  const [deleteError, setDeleteError] = useState("");

  async function handleSaveName() {
    setNameStatus("saving");

    if (isDevMode) {
      setTimeout(() => setNameStatus("saved"), 400);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNameStatus("error");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null })
      .eq("id", user.id);

    setNameStatus(error ? "error" : "saved");
  }

  async function handleSignOut() {
    setSigningOut(true);

    if (isDevMode) {
      router.push("/login");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteConfirmed() {
    setDeleteStep("deleting");
    setDeleteError("");

    if (isDevMode) {
      setTimeout(() => router.push("/"), 400);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleteError("You've been signed out — sign in again.");
      setDeleteStep("idle");
      return;
    }

    await supabase.from("generations").delete().eq("user_id", user.id);
    await supabase.from("topics").delete().eq("user_id", user.id);
    await supabase.from("personas").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>

      <div className="mt-6 flex flex-col gap-8 rounded-lg border border-hairline bg-card p-6 shadow-[0_12px_32px_-18px_rgba(23,22,20,0.25)]">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            Account
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="text-sm text-ink-soft">{email}</p>
            </div>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setNameStatus("idle");
                }}
                placeholder="Your name"
                className="flex-1 rounded-md border border-hairline bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={nameStatus === "saving"}
                className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-60"
              >
                {nameStatus === "saving" ? "saving..." : "Save"}
              </button>
            </div>
            {nameStatus === "saved" && (
              <span className="text-sm text-accent">
                Saved{isDevMode ? " (test mode)" : ""}.
              </span>
            )}
            {nameStatus === "error" && (
              <span className="text-sm text-danger">Couldn&rsquo;t save. Try again.</span>
            )}
          </div>
        </section>

        <section>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
            Usage
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            {generationCount === 0
              ? "No posts generated yet."
              : `You've generated ${generationCount} post${generationCount === 1 ? "" : "s"} so far.`}
          </p>
        </section>

        <section>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink disabled:opacity-60"
          >
            {signingOut ? "signing out..." : "Sign out"}
          </button>
        </section>

        <section className="border-t border-hairline pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-danger">
            Danger zone
          </p>

          {deleteStep === "idle" && (
            <button
              type="button"
              onClick={() => setDeleteStep("confirm")}
              className="mt-3 text-sm font-medium text-danger underline"
            >
              Delete my data
            </button>
          )}

          {deleteStep !== "idle" && (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-sm text-ink">
                This deletes your voice profile, rules, topics, and every
                generated post — permanently. This can&rsquo;t be undone.
              </p>
              {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteStep("idle")}
                  disabled={deleteStep === "deleting"}
                  className="rounded-full border border-hairline px-5 py-3 text-sm font-bold text-ink-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  disabled={deleteStep === "deleting"}
                  className="rounded-full bg-danger px-5 py-3 text-sm font-bold text-card disabled:opacity-60"
                >
                  {deleteStep === "deleting"
                    ? "deleting..."
                    : "Yes, delete everything"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
