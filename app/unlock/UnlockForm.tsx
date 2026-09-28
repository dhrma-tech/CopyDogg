"use client";

import { useState, type FormEvent } from "react";
import { unlock } from "@/app/actions";
import PrimaryButton from "@/components/PrimaryButton";

export default function UnlockForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    // On success the action redirects, so only failures come back.
    let result: Awaited<ReturnType<typeof unlock>> | undefined;
    try {
      result = await unlock(password, next);
    } catch {
      result = { ok: false, error: "Couldn't reach CopyDogg. Check that it's still running." };
    }
    if (result && !result.ok) {
      setError(result.error);
      setChecking(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center font-display text-3xl font-semibold text-ink">
        This CopyDogg is locked
      </h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Enter the password set in COPYDOGG_PASSWORD.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-md border border-hairline bg-card px-4 py-3 text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
        <PrimaryButton type="submit" disabled={checking}>
          {checking ? "checking..." : "Unlock"}
        </PrimaryButton>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </div>
  );
}
