import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { HealthResponseSchema } from '@udccerete/schemas';
import { ok } from '../lib/envelope.js';
import type { AppBindings } from '../types.js';

const rootHealthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check',
  description: 'Sonda para balanceadores y orquestadores. Equivale a GET /api/v1/health.',
  responses: {
    200: {
      description: 'Servicio disponible',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

export function registerRootHealth(app: OpenAPIHono<AppBindings>) {
  app.openapi(rootHealthRoute, (c) => ok(c, { status: 'ok' as const }));
}
