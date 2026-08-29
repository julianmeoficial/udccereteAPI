import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AppError } from '../lib/errors.js';
import { parseJwtPayload, type AuthUser } from '../lib/auth-user.js';
import { env, isAuthConfigured } from '../env.js';
import type { AppBindings } from '../types.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!env.SUPABASE_JWT_JWKS_URL) {
    throw new AppError('SERVICE_DEGRADED', 'Autenticación no configurada');
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(env.SUPABASE_JWT_JWKS_URL));
  }
  return jwks;
}

async function verifyBearer(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getJwks(), {
    algorithms: ['RS256', 'ES256'],
  });
  const user = parseJwtPayload(payload as Record<string, unknown>);
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Token inválido');
  }
  return user;
}

/** Dev fallback cuando no hay JWKS configurado. */
function devUserFromToken(token: string): AuthUser | null {
  if (env.NODE_ENV === 'production' || isAuthConfigured()) return null;
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const json = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    return parseJwtPayload(json);
  } catch {
    return null;
  }
}

export const optionalAuth = createMiddleware<AppBindings>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    await next();
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    if (isAuthConfigured()) {
      c.set('user', await verifyBearer(token));
    } else {
      const devUser = devUserFromToken(token);
      if (devUser) c.set('user', devUser);
    }
  } catch {
    // Token inválido en rutas opcionales: continuar como anónimo
  }
  await next();
});

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Se requiere autenticación');
  }
  const token = header.slice('Bearer '.length);
  try {
    if (isAuthConfigured()) {
      c.set('user', await verifyBearer(token));
    } else {
      const devUser = devUserFromToken(token);
      if (!devUser) throw new AppError('UNAUTHORIZED', 'Token inválido');
      c.set('user', devUser);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('UNAUTHORIZED', 'Token inválido o expirado');
  }
  await next();
});

export function getUser(c: { get: (key: 'user') => AuthUser | undefined }): AuthUser {
  const user = c.get('user');
  if (!user) throw new AppError('UNAUTHORIZED', 'Se requiere autenticación');
  return user;
}
