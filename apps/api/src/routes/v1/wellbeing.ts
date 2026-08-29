import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  IdParamSchema,
  SuccessResponseSchema,
  UpdateWellbeingRouteSchema,
  WellbeingRouteSchema,
} from '@udccerete/schemas';
import { AppError } from '../../lib/errors.js';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { listRoutes, upsertRoute } from '../../services/wellbeing.js';

const listWellbeingRoutesRoute = createRoute({
  method: 'get',
  path: '/wellbeing/routes',
  tags: ['Wellbeing'],
  summary: 'Listar rutas de bienestar',
  responses: {
    200: {
      description: 'Rutas de bienestar',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(WellbeingRouteSchema.array(), 'WellbeingRoutesResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const updateWellbeingRouteRoute = createRoute({
  method: 'put',
  path: '/wellbeing/routes/{id}',
  tags: ['Wellbeing'],
  summary: 'Actualizar ruta de bienestar',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateWellbeingRouteSchema } } },
  },
  responses: {
    200: {
      description: 'Ruta actualizada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(WellbeingRouteSchema, 'WellbeingRouteResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerWellbeingRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/wellbeing/*', requireDatabase);

  app.openapi(listWellbeingRoutesRoute, async (c) => {
    const centerId = c.get('user')?.centerId ?? undefined;
    return ok(c, await listRoutes(centerId));
  });

  app.openapi(updateWellbeingRouteRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_wellbeing');
    if (!user.centerId) {
      throw new AppError('FORBIDDEN', 'Se requiere centro asignado');
    }
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const route = await upsertRoute(id, user.centerId, body);
    return ok(c, route);
  });
}
