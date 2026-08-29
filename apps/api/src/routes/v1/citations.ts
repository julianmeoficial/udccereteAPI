import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  CitationResultSchema,
  CreateCitationSchema,
  SuccessResponseSchema,
} from '@udccerete/schemas';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { resolveCitation } from '../../services/citations.js';

const createCitationRoute = createRoute({
  method: 'post',
  path: '/citations',
  tags: ['Citations'],
  summary: 'Resolver cita bibliográfica',
  request: { body: { content: { 'application/json': { schema: CreateCitationSchema } } } },
  responses: {
    200: {
      description: 'Cita formateada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(CitationResultSchema, 'CitationApiResponse'),
        },
      },
    },
    400: { description: 'Datos inválidos', content: apiErrorJson },
    503: { description: 'Servicio no disponible', content: apiErrorJson },
  },
});

export function registerCitationsRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/citations', requireDatabase);

  app.openapi(createCitationRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await resolveCitation(body);
    return ok(c, result);
  });
}
