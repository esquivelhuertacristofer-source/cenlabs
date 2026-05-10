/**
 * Dual-backend rate limiter.
 * If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash
 * (shared state across all serverless instances).  Otherwise falls back to an
 * in-process Map (per-instance, suitable for local dev and single-process deploys).
 */

// ── Shared interface ──────────────────────────────────────────────────────────

export interface CheckResult {
  allowed:   boolean;
  remaining: number;
  resetIn:   number;  // milliseconds until window resets
}

export interface RateLimiter {
  check(key: string): Promise<CheckResult>;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

type RLEntry = { count: number; resetAt: number };

class InMemoryLimiter implements RateLimiter {
  private readonly map = new Map<string, RLEntry>();

  constructor(private readonly windowMs: number, private readonly maxReq: number) {
    if (typeof setInterval !== 'undefined') {
      const t = setInterval(() => this.purge(), 5 * 60_000);
      if (typeof t === 'object' && 'unref' in t) (t as NodeJS.Timeout).unref();
    }
  }

  async check(key: string): Promise<CheckResult> {
    const now   = Date.now();
    const entry = this.map.get(key);

    if (!entry || now >= entry.resetAt) {
      this.map.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxReq - 1, resetIn: this.windowMs };
    }

    if (entry.count >= this.maxReq) {
      return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxReq - entry.count, resetIn: entry.resetAt - now };
  }

  private purge(): void {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (now >= entry.resetAt) this.map.delete(key);
    }
  }
}

// ── Upstash backend ───────────────────────────────────────────────────────────

class UpstashLimiter implements RateLimiter {
  // Lazy-initialised so the import only runs when the env vars are confirmed present.
  private limiter: import('@upstash/ratelimit').Ratelimit | null = null;

  constructor(
    private readonly maxReq: number,
    private readonly window: string,    // e.g. '1 m'
    private readonly prefix: string,
  ) {}

  private async getLimiter(): Promise<import('@upstash/ratelimit').Ratelimit> {
    if (this.limiter) return this.limiter;
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis }     = await import('@upstash/redis');
    this.limiter = new Ratelimit({
      redis:   Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(this.maxReq, this.window as `${number} ${'ms'|'s'|'m'|'h'|'d'}`),
      prefix:  this.prefix,
    });
    return this.limiter;
  }

  async check(key: string): Promise<CheckResult> {
    const limiter = await this.getLimiter();
    const res     = await limiter.limit(key);
    return {
      allowed:   res.success,
      remaining: res.remaining,
      resetIn:   Math.max(0, res.reset - Date.now()),
    };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createLimiter(maxReq: number, windowMs: number, prefix: string): RateLimiter {
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    const minutes = Math.round(windowMs / 60_000);
    return new UpstashLimiter(maxReq, `${minutes} m`, prefix);
  }

  return new InMemoryLimiter(windowMs, maxReq);
}

// ── Singletons (warm-start safe) ──────────────────────────────────────────────

export const ipLimiter   = createLimiter(30, 60_000, 'cen:rl:ip');
export const userLimiter = createLimiter(10, 60_000, 'cen:rl:user');
