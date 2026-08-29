import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const nodeEnv = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error(`NODE_ENV inválido (worker): ${nodeEnv}`);
}

const logLevel = process.env.LOG_LEVEL ?? 'info';
if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
  throw new Error(`LOG_LEVEL inválido (worker): ${logLevel}`);
}

export const env = {
  NODE_ENV: nodeEnv as 'development' | 'test' | 'production',
  LOG_LEVEL: logLevel as 'debug' | 'info' | 'warn' | 'error',
  REDIS_URL: process.env.REDIS_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

export function isRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL);
}

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
export const workerVersion = JSON.parse(readFileSync(pkgPath, 'utf8')).version as string;
