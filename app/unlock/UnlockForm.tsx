"use client";

import { useState, type FormEvent } from "react";
import { unlock } from "@/app/actions";
import Button from "@/components/ui/Button";
import { FIELD } from "@/components/ui/Field";
import Logo from "@/components/Logo";

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
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <h1 className="text-center font-display text-title text-ink">
        This CopyDogg is locked
      </h1>
      <p className="mt-2 text-center text-body text-ink-soft">
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
          className={FIELD}
        />
        <Button type="submit" block disabled={checking}>
          {checking ? "checking..." : "Unlock"}
        </Button>
        {error && <p role="alert" className="text-small text-danger">{error}</p>}
      </form>
    </div>
  );
}
