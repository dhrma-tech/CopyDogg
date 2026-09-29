import { headers } from "next/headers";

/**
 * A simple in-memory, fixed-window rate limit. CopyDogg is single-user and
 * single-process, so this doesn't need to survive a restart or scale across
 * instances — it only has to stop a runaway script or a password-guesser
 * from hammering the one server that's running.
 */
const globalState = globalThis as { __copydoggRateLimits?: Map<string, { count: number; resetAt: number }> };
const buckets = globalState.__copydoggRateLimits ?? new Map<string, { count: number; resetAt: number }>();
globalState.__copydoggRateLimits = buckets;

/** True if this call is allowed; false if `key` has hit `limit` within `windowMs`. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort caller IP, from the headers a reverse proxy sets. Not spoof-proof, good enough here. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

/** Same, from a Request object (route handlers) instead of the headers() helper. */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
