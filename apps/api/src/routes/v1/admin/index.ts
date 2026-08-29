import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  AdminUserSchema,
  AdminUsersQuerySchema,
  AnalyticsSummarySchema,
  AuditLogEntrySchema,
  AuditQuerySchema,
  IdParamSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  UpdateUserRoleSchema,
} from '@udccerete/schemas';
import { ok, okPaginated } from '../../../lib/envelope.js';
import { apiErrorJson } from '../../../lib/openapi-responses.js';
import { requirePermission } from '../../../lib/permissions.js';
import { getUser, requireAuth } from '../../../middleware/auth.js';
import { requireDatabase } from '../../../middleware/database.js';
import type { AppBindings } from '../../../types.js';
import {
  getAnalyticsSummary,
  listAudit,
  listUsers,
  updateUserRole,
} from '../../../services/admin.js';

const listUsersRoute = createRoute({
  method: 'get',
  path: '/admin/users',
  tags: ['Admin'],
  summary: 'Listar usuarios',
  security: [{ bearerAuth: [] }],
  request: { query: AdminUsersQuerySchema },
  responses: {
    200: {
      description: 'Usuarios paginados',
      content: {
        'application/json': { schema: PaginatedResponseSchema(AdminUserSchema, 'AdminUsersListResponse') },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const updateUserRoleRoute = createRoute({
  method: 'patch',
  path: '/admin/users/{id}/role',
  tags: ['Admin'],
  summary: 'Actualizar rol de usuario',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateUserRoleSchema } } },
  },
  responses: {
    200: {
      description: 'Usuario actualizado',
      content: {
        'application/json': { schema: SuccessResponseSchema(AdminUserSchema, 'AdminUserResponse') },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const listAuditRoute = createRoute({
  method: 'get',
  path: '/admin/audit',
  tags: ['Admin'],
  summary: 'Consultar auditoría',
  security: [{ bearerAuth: [] }],
  request: { query: AuditQuerySchema },
  responses: {
    200: {
      description: 'Entradas de auditoría paginadas',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema(AuditLogEntrySchema, 'AuditLogListResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const analyticsRoute = createRoute({
  method: 'get',
  path: '/admin/analytics',
  tags: ['Admin'],
  summary: 'Resumen analítico',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Métricas agregadas',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(AnalyticsSummarySchema, 'AnalyticsSummaryResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerAdminRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/admin/*', requireAuth, requireDatabase);

  app.openapi(listUsersRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_users');
    const query = c.req.valid('query');
    const { items, pagination } = await listUsers(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(updateUserRoleRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_users');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const updated = await updateUserRole(id, body);
    return ok(c, updated);
  });

  app.openapi(listAuditRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_users');
    const query = c.req.valid('query');
    const { items, pagination } = await listAudit(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(analyticsRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'view_analytics');
    const summary = await getAnalyticsSummary();
    return ok(c, summary);
  });
}
