/**
 * Rate limiter in-memory, best-effort (janela fixa por chave).
 *
 * Limitação conhecida: o estado vive no processo, então em ambientes serverless
 * com múltiplas instâncias o limite é por-instância, não global. Serve como
 * primeira barreira contra scraping/abuso; para um teto rígido global use um
 * store compartilhado (Redis/Postgres).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Poda oportunística para não crescer indefinidamente.
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
