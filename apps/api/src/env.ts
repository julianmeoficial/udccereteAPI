import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from '@hono/zod-openapi';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };

function loadDotEnv() {
  const candidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
  for (const path of candidates) {
    if (existsSync(path)) {
      process.loadEnvFile(path);
      return;
    }
  }
}

loadDotEnv();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_JWKS_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  TYPESENSE_HOST: z.string().optional(),
  TYPESENSE_PORT: z.coerce.number().int().optional(),
  TYPESENSE_PROTOCOL: z.enum(['http', 'https']).optional(),
  TYPESENSE_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  SITE_URL: z.string().url().default('http://localhost:3000'),
  AUTH_REDIRECT_URL: z.string().url().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '(env)'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Variables de entorno inválidas: ${details}`);
}

export const API_NAME = 'API Blog UDEC Cereté';
export const apiVersion = pkg.version;
export const env = parsed.data;

export function isAuthConfigured(): boolean {
  return Boolean(env.SUPABASE_JWT_JWKS_URL);
}

export function isSupabaseAuthClientConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export function isRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL);
}

export function isTypesenseConfigured(): boolean {
  return Boolean(env.TYPESENSE_HOST && env.TYPESENSE_API_KEY);
}

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME,
  );
}
