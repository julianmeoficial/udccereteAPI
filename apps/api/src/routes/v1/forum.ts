import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  CreateForumOpinionSchema,
  ForumOpinionSchema,
  ForumQuerySchema,
  ForumSummarySchema,
  IdParamSchema,
  ModerateForumOpinionSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
} from '@udccerete/schemas';
import { AppError } from '../../lib/errors.js';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requireInstitutionalEmail, requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { createOpinion, getSummary, listOpinions, moderateOpinion } from '../../services/forum.js';

const listForumOpinionsRoute = createRoute({
  method: 'get',
  path: '/forum/opinions',
  tags: ['Forum'],
  summary: 'Listar opiniones del foro',
  request: { query: ForumQuerySchema },
  responses: {
    200: {
      description: 'Opiniones paginadas',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema(ForumOpinionSchema, 'ForumOpinionsListResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const forumSummaryRoute = createRoute({
  method: 'get',
  path: '/forum/summary',
  tags: ['Forum'],
  summary: 'Resumen de valoraciones del foro',
  request: { query: ForumQuerySchema.pick({ targetType: true, courseId: true, tutorId: true }) },
  responses: {
    200: {
      description: 'Resumen',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(ForumSummarySchema, 'ForumSummaryResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createForumOpinionRoute = createRoute({
  method: 'post',
  path: '/forum/opinions',
  tags: ['Forum'],
  summary: 'Publicar opinión anónima',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateForumOpinionSchema } } } },
  responses: {
    201: {
      description: 'Opinión creada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(ForumOpinionSchema, 'ForumOpinionResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso o correo no institucional', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const moderateForumOpinionRoute = createRoute({
  method: 'patch',
  path: '/moderation/forum/{id}',
  tags: ['Moderation'],
  summary: 'Moderar opinión del foro',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: ModerateForumOpinionSchema } } },
  },
  responses: {
    200: {
      description: 'Opinión moderada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(ForumOpinionSchema, 'ForumOpinionResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerForumRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/forum/*', requireDatabase);
  app.use('/moderation/forum/*', requireDatabase);

  app.openapi(listForumOpinionsRoute, async (c) => {
    const query = c.req.valid('query');
    const { items, pagination } = await listOpinions(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(forumSummaryRoute, async (c) => {
    const query = c.req.valid('query');
    if (!query.targetType) {
      throw new AppError('VALIDATION_ERROR', 'targetType es requerido');
    }
    const targetId = query.targetType === 'course' ? query.courseId : query.tutorId;
    if (!targetId) {
      throw new AppError('VALIDATION_ERROR', 'courseId o tutorId es requerido según targetType');
    }
    const summary = await getSummary(query.targetType, targetId);
    return ok(c, summary);
  });

  app.openapi(createForumOpinionRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'comment');
    requireInstitutionalEmail(user.email);
    const body = c.req.valid('json');
    const opinion = await createOpinion(body);
    return created(c, opinion);
  });

  app.openapi(moderateForumOpinionRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'moderate');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const opinion = await moderateOpinion(id, body);
    return ok(c, opinion);
  });
}
