// In-memory, single-process rate limiter. Safe for the current single-box
// deploy; scaling out to multiple app containers will require a shared
// store (Redis). Eviction under MAX_BUCKETS pressure picks the bucket
// closest to expiring (true TTL semantics), not FIFO-by-insertion — so a
// burst of new keys can't evict a currently-active limit bucket.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function getOrCreate(key: string, windowMs: number): Bucket {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict the bucket closest to expiry — minimises impact on active limits
      let evictKey: string | undefined;
      let evictResetAt = Infinity;
      for (const [k, v] of buckets) {
        if (v.resetAt < evictResetAt) {
          evictResetAt = v.resetAt;
          evictKey = k;
        }
      }
      if (evictKey) buckets.delete(evictKey);
    }
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  return b;
}

// Atomically consume one slot. Returns ok:false if the bucket is full
// (no slot is consumed in that case).
export function limit(key: string, max: number, windowMs: number): LimitResult {
  const b = getOrCreate(key, windowMs);
  if (b.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - Date.now()) / 1000)),
    };
  }
  b.count++;
  return { ok: true };
}

// Refund a previously-consumed slot. Use when a downstream operation
// fails (e.g. a third-party API call) and we don't want to count that
// attempt against the user. Safe to call even if the window already
// reset.
export function refund(key: string): void {
  const b = buckets.get(key);
  if (b && b.count > 0) b.count--;
}

export function ipKey(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimited(retryAfterSec: number) {
  return new Response(JSON.stringify({ error: "RATE_LIMIT" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
    },
  });
}
