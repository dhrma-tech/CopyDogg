import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Optional password gate for copies exposed beyond localhost. Off unless
 * COPYDOGG_PASSWORD is set. The cookie is an expiring, signed token, not the
 * password's hash, and the signing key is stretched with scrypt so a stolen
 * cookie can't be used to guess the password quickly. Changing the password
 * signs every device out.
 */
export const GATE_COOKIE = "copydogg_unlock";
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function gatePassword(): string | undefined {
  return process.env.COPYDOGG_PASSWORD || undefined;
}

// scrypt is slow on purpose: derive once per password, keep it in memory.
let cachedKey: { password: string; key: Buffer } | undefined;
function signingKey(password: string): Buffer {
  if (cachedKey?.password !== password) {
    cachedKey = { password, key: scryptSync(password, "copydogg-gate-v1", 32) };
  }
  return cachedKey.key;
}

function sign(password: string, expires: string): string {
  return createHmac("sha256", signingKey(password)).update(`copydogg:${expires}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** A fresh cookie value that stays valid for GATE_MAX_AGE_SECONDS. */
export function newToken(password: string): string {
  const expires = String(Date.now() + GATE_MAX_AGE_SECONDS * 1000);
  return `${expires}.${sign(password, expires)}`;
}

export function isValidToken(token: string | undefined): boolean {
  const password = gatePassword();
  if (!password) return true;
  if (!token) return false;
  const [expires, signature, ...rest] = token.split(".");
  if (!expires || !signature || rest.length > 0) return false;
  if (!(Number(expires) > Date.now())) return false;
  return safeEqual(signature, sign(password, expires));
}

export function isCorrectPassword(attempt: string): boolean {
  const password = gatePassword();
  return !!password && safeEqual(sign(attempt, "check"), sign(password, "check"));
}

/**
 * Server actions can be invoked from any route, including /unlock which the
 * proxy leaves open, so every action re-checks the gate itself.
 */
export async function assertUnlocked(): Promise<void> {
  if (!isValidToken((await cookies()).get(GATE_COOKIE)?.value)) {
    throw new Error("Locked. Enter the password first.");
  }
}
