import { createMiddleware } from 'hono/factory';
import { isDatabaseConfigured, checkDatabaseConnection } from '@udccerete/db';
import { AppError } from '../lib/errors.js';
import type { AppBindings } from '../types.js';

export const requireDatabase = createMiddleware<AppBindings>(async (c, next) => {
  if (!isDatabaseConfigured()) {
    throw new AppError('SERVICE_DEGRADED', 'Base de datos no configurada');
  }
  const ok = await checkDatabaseConnection();
  if (!ok) {
    throw new AppError('SERVICE_DEGRADED', 'Base de datos no disponible');
  }
  await next();
});
