import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { checkDatabaseConnection, isDatabaseConfigured } from '@udccerete/db';
import { SuccessResponseSchema } from '@udccerete/schemas';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { isRedisConfigured } from '../../env.js';
import type { AppBindings } from '../../types.js';

const HealthDataExtendedSchema = z
  .object({
    status: z.literal('ok'),
    checks: z
      .object({
        database: z.enum(['ok', 'degraded', 'not_configured']),
        redis: z.enum(['ok', 'degraded', 'not_configured']),
      })
      .optional(),
  })
  .openapi('HealthDataExtended');

const HealthExtendedResponseSchema = SuccessResponseSchema(
  HealthDataExtendedSchema,
  'HealthExtendedResponse',
);

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Estado del servicio (readiness)',
  description:
    'Comprueba disponibilidad de la API v1 e incluye checks opcionales de Postgres y Redis.',
  responses: {
    200: {
      description: 'Servicio disponible',
      content: { 'application/json': { schema: HealthExtendedResponseSchema } },
    },
    429: { description: 'Demasiadas peticiones', content: apiErrorJson },
  },
});

async function buildHealthChecks() {
  let database: 'ok' | 'degraded' | 'not_configured' = 'not_configured';
  if (isDatabaseConfigured()) {
    database = (await checkDatabaseConnection()) ? 'ok' : 'degraded';
  }

  let redis: 'ok' | 'degraded' | 'not_configured' = 'not_configured';
  if (isRedisConfigured()) {
    redis = 'ok';
  }

  return { database, redis };
}

export function registerHealthRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(healthRoute, async (c) => {
    const checks = await buildHealthChecks();
    return ok(c, { status: 'ok' as const, checks });
  });
}
