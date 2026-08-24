import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { MetaResponseSchema } from '@udccerete/schemas';
import { API_NAME, apiVersion, env } from '../../env.js';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import type { AppBindings } from '../../types.js';

const metaRoute = createRoute({
  method: 'get',
  path: '/meta',
  tags: ['System'],
  summary: 'Metadatos del servicio',
  description: 'Nombre, versión (package.json) y entorno (NODE_ENV) de la API.',
  responses: {
    200: {
      description: 'Información del servicio',
      content: {
        'application/json': {
          schema: MetaResponseSchema,
        },
      },
    },
    429: {
      description: 'Demasiadas peticiones',
      content: apiErrorJson,
    },
  },
});

export function registerMetaRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(metaRoute, (c) =>
    ok(c, {
      name: API_NAME,
      version: apiVersion,
      environment: env.NODE_ENV,
      status: 'ok' as const,
    }),
  );
}
