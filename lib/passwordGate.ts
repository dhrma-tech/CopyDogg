import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Optional password gate for copies exposed beyond localhost. Off unless
 * COPYDOGG_PASSWORD is set. The cookie holds a hash of the password, so
 * changing the password signs every device out.
 */
export const GATE_COOKIE = "copydogg_unlock";

export function gatePassword(): string | undefined {
  return process.env.COPYDOGG_PASSWORD || undefined;
}

export function tokenFor(password: string): string {
  return createHash("sha256").update(`copydogg:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isValidToken(token: string | undefined): boolean {
  const password = gatePassword();
  if (!password) return true;
  return !!token && safeEqual(token, tokenFor(password));
}

export function isCorrectPassword(attempt: string): boolean {
  const password = gatePassword();
  return !!password && safeEqual(tokenFor(attempt), tokenFor(password));
}
