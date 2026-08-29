import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import {
  IdParamSchema,
  PaginatedResponseSchema,
  PaginationQuerySchema,
  PostSummarySchema,
  SuccessMessageSchema,
  SuccessResponseSchema,
} from '@udccerete/schemas';
import { ok, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { listSaved, markRead, savePost, unsavePost } from '../../services/saved.js';

const SavedAtSchema = z
  .object({ savedAt: z.string().datetime({ offset: true }) })
  .openapi('SavedAtResponse');

const ReadAtSchema = z
  .object({ readAt: z.string().datetime({ offset: true }) })
  .openapi('ReadAtResponse');

const listSavedRoute = createRoute({
  method: 'get',
  path: '/me/saved',
  tags: ['Saved'],
  summary: 'Listar publicaciones guardadas',
  security: [{ bearerAuth: [] }],
  request: { query: PaginationQuerySchema },
  responses: {
    200: {
      description: 'Publicaciones guardadas',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema(PostSummarySchema, 'SavedPostsListResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const savePostRoute = createRoute({
  method: 'put',
  path: '/posts/{id}/save',
  tags: ['Saved'],
  summary: 'Guardar publicación',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Publicación guardada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(SavedAtSchema, 'SavePostResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const unsavePostRoute = createRoute({
  method: 'delete',
  path: '/posts/{id}/save',
  tags: ['Saved'],
  summary: 'Quitar publicación guardada',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Publicación eliminada de guardados',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(SuccessMessageSchema, 'UnsavePostResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const markPostReadRoute = createRoute({
  method: 'post',
  path: '/posts/{id}/read',
  tags: ['Saved'],
  summary: 'Marcar publicación como leída',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Publicación marcada como leída',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(ReadAtSchema, 'MarkPostReadResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerSavedRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/me/saved', requireAuth, requireDatabase);
  app.use('/posts/:id/save', requireAuth, requireDatabase);
  app.use('/posts/:id/read', requireAuth, requireDatabase);

  app.openapi(listSavedRoute, async (c) => {
    const user = getUser(c);
    const query = c.req.valid('query');
    const { items, pagination } = await listSaved(user.sub, query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(savePostRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    const result = await savePost(user.sub, id);
    return ok(c, result);
  });

  app.openapi(unsavePostRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    await unsavePost(user.sub, id);
    return ok(c, { message: 'Publicación eliminada de guardados' });
  });

  app.openapi(markPostReadRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    const result = await markRead(user.sub, id);
    return ok(c, result);
  });
}
