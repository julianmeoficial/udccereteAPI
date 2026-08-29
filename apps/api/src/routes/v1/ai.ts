import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { AiAskSchema } from '@udccerete/schemas';
import { AppError } from '../../lib/errors.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import type { AppBindings } from '../../types.js';

const aiAskRoute = createRoute({
  method: 'post',
  path: '/ai/ask',
  tags: ['AI'],
  summary: 'Consultar asistente IA',
  description: 'Temporalmente deshabilitado (SERVICE_DEGRADED).',
  request: { body: { content: { 'application/json': { schema: AiAskSchema } } } },
  responses: {
    503: { description: 'Servicio degradado', content: apiErrorJson },
  },
});

export function registerAiRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(aiAskRoute, async () => {
    throw new AppError('SERVICE_DEGRADED', 'El asistente IA no está disponible temporalmente');
  });
}
