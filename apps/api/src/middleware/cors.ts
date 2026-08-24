import { cors } from 'hono/cors';
import { env } from '../env.js';

const origins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowAll = origins.includes('*');

/**
 * CORS configurable por `CORS_ORIGIN` (lista separada por comas).
 * En desarrollo el default permite localhost; no usa `*` con credenciales.
 */
export const corsMiddleware = cors({
  origin: allowAll ? '*' : origins,
  credentials: !allowAll,
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  exposeHeaders: ['x-request-id'],
  maxAge: 86400,
});
