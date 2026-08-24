import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { HealthResponseSchema } from '@udccerete/schemas';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import type { AppBindings } from '../../types.js';

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Estado del servicio',
  description: 'Comprueba que la API v1 responde.',
  responses: {
    200: {
      description: 'Servicio disponible',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
    429: {
      description: 'Demasiadas peticiones',
      content: apiErrorJson,
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(healthRoute, (c) => ok(c, { status: 'ok' as const }));
}
