import { createMiddleware } from 'hono/factory';
import { env } from '../env.js';
import { toApiError } from '../lib/errors.js';
import type { AppBindings } from '../types.js';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, env.RATE_LIMIT_WINDOW_MS);

cleanup.unref();

function clientKey(ipHeader: string | undefined, realIp: string | undefined): string {
  const forwarded = ipHeader?.split(',')[0]?.trim();
  return forwarded || realIp || 'local';
}

/**
 * Rate limit en memoria (proceso único, ventana fija).
 * En producción irá detrás de un gateway y/o Redis (`REDIS_URL`).
 */
export const rateLimitMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const now = Date.now();
  const key = clientKey(c.req.header('x-forwarded-for'), c.req.header('x-real-ip'));
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    await next();
    return;
  }

  current.count += 1;

  if (current.count > env.RATE_LIMIT_MAX) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    c.header('Retry-After', String(retryAfter));
    const requestId = c.get('requestId') ?? crypto.randomUUID();
    return c.json(
      toApiError({
        code: 'RATE_LIMITED',
        message: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.',
        requestId,
      }),
      429,
    );
  }

  await next();
});
