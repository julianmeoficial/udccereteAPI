import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  IdParamSchema,
  NotificationSchema,
  NotificationsQuerySchema,
  PaginatedResponseSchema,
  PushSubscriptionSchema,
  SuccessMessageSchema,
  SuccessResponseSchema,
} from '@udccerete/schemas';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import {
  createPushSubscription,
  listNotifications,
  markRead,
} from '../../services/notifications.js';

const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/notifications',
  tags: ['Notifications'],
  summary: 'Listar notificaciones del usuario',
  security: [{ bearerAuth: [] }],
  request: { query: NotificationsQuerySchema },
  responses: {
    200: {
      description: 'Notificaciones paginadas',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema(NotificationSchema, 'NotificationsListResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const markNotificationReadRoute = createRoute({
  method: 'patch',
  path: '/notifications/{id}/read',
  tags: ['Notifications'],
  summary: 'Marcar notificación como leída',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Notificación actualizada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(NotificationSchema, 'NotificationResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const pushSubscriptionRoute = createRoute({
  method: 'post',
  path: '/push/subscriptions',
  tags: ['Notifications'],
  summary: 'Registrar suscripción push',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: PushSubscriptionSchema } } } },
  responses: {
    201: {
      description: 'Suscripción registrada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(SuccessMessageSchema, 'PushSubscriptionResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerNotificationsRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/notifications', requireAuth, requireDatabase);
  app.use('/notifications/*', requireAuth, requireDatabase);
  app.use('/push/subscriptions', requireAuth, requireDatabase);

  app.openapi(listNotificationsRoute, async (c) => {
    const user = getUser(c);
    const query = c.req.valid('query');
    const { items, pagination } = await listNotifications(user.sub, query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(markNotificationReadRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    const notification = await markRead(id, user.sub);
    return ok(c, notification);
  });

  app.openapi(pushSubscriptionRoute, async (c) => {
    const user = getUser(c);
    const body = c.req.valid('json');
    await createPushSubscription(user.sub, body);
    return created(c, { message: 'Suscripción push registrada' });
  });
}
