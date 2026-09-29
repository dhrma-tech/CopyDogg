"use client";

import { useState, type FormEvent } from "react";
import { unlock } from "@/app/actions";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";

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
    <Card variant="main" className="w-full max-w-sm">
      <h1 className="text-center font-display text-h3 text-ink">This CopyDogg is locked</h1>
      <p className="mt-2 text-center text-body text-ink-65">
        Enter the password set in <code className="font-mono text-meta text-ink">COPYDOGG_PASSWORD</code>.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <Input
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" variant="accent" block disabled={checking}>
          {checking ? "checking..." : "Unlock"}
        </Button>
        {error && <p role="alert" className="text-ui text-ink">{error}</p>}
      </form>
    </Card>
  );
}
