import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { SearchQuerySchema, SearchResponseSchema, SuccessResponseSchema } from '@udccerete/schemas';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { search } from '../../services/search.js';

const searchRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Search'],
  summary: 'Búsqueda global',
  request: { query: SearchQuerySchema },
  responses: {
    200: {
      description: 'Resultados de búsqueda',
      content: {
        'application/json': { schema: SuccessResponseSchema(SearchResponseSchema, 'SearchApiResponse') },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerSearchRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/search', requireDatabase);

  app.openapi(searchRoute, async (c) => {
    const query = c.req.valid('query');
    const result = await search(query);
    return ok(c, result);
  });
}
