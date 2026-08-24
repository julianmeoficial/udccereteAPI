import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { HealthResponseSchema } from '@udccerete/schemas';
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
  },
});

export function registerHealthRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(healthRoute, (c) => c.json({ status: 'ok' as const }, 200));
}
