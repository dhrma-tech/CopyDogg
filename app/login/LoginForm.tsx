"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isDevMode } from "@/lib/devMode";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link-expired";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    if (isDevMode) {
      setTimeout(() => router.push("/app"), 500);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center font-display text-3xl font-semibold text-ink">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        We&rsquo;ll email you a link. No password to remember.
      </p>

      {status === "sent" ? (
        <p className="mt-8 rounded-md border border-hairline bg-card px-4 py-3 text-center text-sm text-ink">
          Check your email — we sent a link to {email}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          {linkExpired && (
            <p className="text-sm text-danger">
              That link expired. Enter your email and we&rsquo;ll send a new
              one.
            </p>
          )}
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-hairline bg-card px-4 py-3 text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-ink px-5 py-3 font-bold text-card disabled:opacity-60"
          >
            {status === "sending"
              ? isDevMode
                ? "test mode — signing you in..."
                : "sending the link..."
              : "Send magic link"}
          </button>
          {status === "error" && (
            <p className="text-sm text-danger">
              {errorMessage ||
                "Something went wrong sending that link. Try again."}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
