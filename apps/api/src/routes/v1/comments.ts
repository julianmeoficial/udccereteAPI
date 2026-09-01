import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import {
  CommentSchema,
  CommentsQuerySchema,
  CreateCommentSchema,
  IdParamSchema,
  ModerateCommentSchema,
  PaginatedResponseSchema,
  ReportCommentSchema,
  SuccessResponseSchema,
} from '@udccerete/schemas';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requireInstitutionalEmail, requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { createComment, listComments, moderateComment, reportComment } from '../../services/comments.js';

const PostIdParamSchema = z
  .object({
    postId: z
      .string()
      .uuid()
      .openapi({
        param: { name: 'postId', in: 'path' },
        description: 'Identificador UUID de la publicación',
      }),
  })
  .openapi('PostIdParam');

const listCommentsRoute = createRoute({
  method: 'get',
  path: '/posts/{postId}/comments',
  tags: ['Comments'],
  summary: 'Listar comentarios de una publicación',
  request: {
    params: PostIdParamSchema,
    query: CommentsQuerySchema,
  },
  responses: {
    200: {
      description: 'Comentarios paginados',
      content: {
        'application/json': { schema: PaginatedResponseSchema(CommentSchema, 'CommentsListResponse') },
      },
    },
    404: { description: 'Publicación no encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createCommentRoute = createRoute({
  method: 'post',
  path: '/posts/{postId}/comments',
  tags: ['Comments'],
  summary: 'Crear comentario',
  security: [{ bearerAuth: [] }],
  request: {
    params: PostIdParamSchema,
    body: { content: { 'application/json': { schema: CreateCommentSchema } } },
  },
  responses: {
    201: {
      description: 'Comentario creado',
      content: {
        'application/json': { schema: SuccessResponseSchema(CommentSchema, 'CommentResponse') },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso o correo no institucional', content: apiErrorJson },
    404: { description: 'Publicación no encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const moderateCommentRoute = createRoute({
  method: 'patch',
  path: '/moderation/comments/{id}',
  tags: ['Moderation'],
  summary: 'Moderar comentario',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: ModerateCommentSchema } } },
  },
  responses: {
    200: {
      description: 'Comentario moderado',
      content: {
        'application/json': { schema: SuccessResponseSchema(CommentSchema, 'CommentResponse') },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const reportCommentRoute = createRoute({
  method: 'post',
  path: '/comments/{id}/report',
  tags: ['Comments'],
  summary: 'Reportar comentario',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: ReportCommentSchema } } },
  },
  responses: {
    200: {
      description: 'Reporte registrado',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(
            z
              .object({
                reportCount: z.number().int(),
                autoHidden: z.boolean(),
              })
              .openapi('ReportCommentResult'),
            'ReportCommentResponse',
          ),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso o correo no institucional', content: apiErrorJson },
    404: { description: 'Comentario no encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerCommentsRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/posts/:postId/comments', requireDatabase);
  app.use('/comments/:id/report', requireDatabase);
  app.use('/moderation/comments/:id', requireDatabase);

  app.openapi(listCommentsRoute, async (c) => {
    const { postId } = c.req.valid('param');
    const query = c.req.valid('query');
    const { items, pagination } = await listComments(postId, query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(createCommentRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'comment');
    requireInstitutionalEmail(user.email);
    const { postId } = c.req.valid('param');
    const body = c.req.valid('json');
    const comment = await createComment(postId, user.sub, body);
    return created(c, comment);
  });

  app.openapi(moderateCommentRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'moderate');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const comment = await moderateComment(id, body);
    return ok(c, comment);
  });

  app.openapi(reportCommentRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'comment');
    requireInstitutionalEmail(user.email);
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await reportComment(id, user.sub, body);
    return ok(c, result);
  });
}
