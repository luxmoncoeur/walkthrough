/** Start of every 429 body we send; `userMessage()` shows these as-is instead of the provider "busy" text. */
export const TOO_MANY = "Too many requests from your network.";

/**
 * Fixed-window counter per key. Returns 0 if the hit is allowed, otherwise the seconds until the window resets.
 * shortcut: in-memory, so each serverless instance counts separately and counts reset on cold start; move to Vercel KV/Upstash if traffic grows.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()): number => {
    // Drop expired windows now and then so the map can't grow without bound.
    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    const w = windows.get(key);
    if (!w || w.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return 0;
    }
    if (w.count < limit) {
      w.count++;
      return 0;
    }
    return Math.ceil((w.resetAt - now) / 1000);
  };
}

/** First x-forwarded-for entry (set by Vercel's edge); all unknown clients share one bucket. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Applies `limiter` to the request's IP; returns a 429 with Retry-After, or null if allowed. */
export function rateLimit(req: Request, limiter: ReturnType<typeof createRateLimiter>): Response | null {
  const wait = limiter(clientIp(req.headers));
  if (!wait) return null;
  const minutes = Math.ceil(wait / 60);
  return new Response(`${TOO_MANY} Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, {
    status: 429,
    headers: { "retry-after": String(wait) },
  });
}
