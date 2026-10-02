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
  if (buckets.size > 500) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Any client can send x-forwarded-for, so it's only believed when you say a
 * reverse proxy you control sets it (COPYDOGG_TRUST_PROXY=1). Otherwise every
 * caller shares one bucket, which is fine for a single-user app.
 */
function ipFrom(get: (name: string) => string | null): string {
  if (process.env.COPYDOGG_TRUST_PROXY !== "1") return "shared";
  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").pop()!.trim();
  return get("x-real-ip") || "shared";
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return ipFrom((name) => h.get(name));
}

/** Same, from a Request object (route handlers) instead of the headers() helper. */
export function clientIpFromRequest(request: Request): string {
  return ipFrom((name) => request.headers.get(name));
}
