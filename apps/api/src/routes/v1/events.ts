import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import {
  cancelEvent,
  createEvent,
  getEvent,
  listEvents,
  register,
  unregister,
  updateEvent,
} from '../../services/events.js';
import {
  EventRegistrationSchema,
  EventsQuerySchema,
  EventSchema,
  IdParamSchema,
  PaginatedResponseSchema,
  SuccessMessageSchema,
  SuccessResponseSchema,
  UpdateEventSchema,
  CreateEventSchema,
} from '@udccerete/schemas';

const listEventsRoute = createRoute({
  method: 'get',
  path: '/events',
  tags: ['Events'],
  summary: 'Listar eventos',
  request: { query: EventsQuerySchema },
  responses: {
    200: {
      description: 'Eventos paginados',
      content: {
        'application/json': { schema: PaginatedResponseSchema(EventSchema, 'EventsListResponse') },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const getEventRoute = createRoute({
  method: 'get',
  path: '/events/{id}',
  tags: ['Events'],
  summary: 'Obtener evento',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Evento',
      content: { 'application/json': { schema: SuccessResponseSchema(EventSchema, 'EventResponse') } },
    },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createEventRoute = createRoute({
  method: 'post',
  path: '/events',
  tags: ['Events'],
  summary: 'Crear evento',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateEventSchema } } } },
  responses: {
    201: {
      description: 'Evento creado',
      content: { 'application/json': { schema: SuccessResponseSchema(EventSchema, 'EventResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const updateEventRoute = createRoute({
  method: 'patch',
  path: '/events/{id}',
  tags: ['Events'],
  summary: 'Actualizar evento',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateEventSchema } } },
  },
  responses: {
    200: {
      description: 'Evento actualizado',
      content: { 'application/json': { schema: SuccessResponseSchema(EventSchema, 'EventResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/events/{id}',
  tags: ['Events'],
  summary: 'Cancelar evento',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Evento cancelado',
      content: { 'application/json': { schema: SuccessResponseSchema(EventSchema, 'EventResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const registerEventRoute = createRoute({
  method: 'post',
  path: '/events/{id}/registrations',
  tags: ['Events'],
  summary: 'Inscribirse a un evento',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    201: {
      description: 'Inscripción creada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(EventRegistrationSchema, 'EventRegistrationResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    409: { description: 'Conflicto de inscripción', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const unregisterEventRoute = createRoute({
  method: 'delete',
  path: '/events/{id}/registrations',
  tags: ['Events'],
  summary: 'Cancelar inscripción a un evento',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Inscripción cancelada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(SuccessMessageSchema, 'EventUnregisterResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerEventsRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/events', requireDatabase);
  app.use('/events/*', requireDatabase);

  app.openapi(listEventsRoute, async (c) => {
    const query = c.req.valid('query');
    const { items, pagination } = await listEvents(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(getEventRoute, async (c) => {
    const { id } = c.req.valid('param');
    const event = await getEvent(id);
    return ok(c, event);
  });

  app.openapi(createEventRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_events');
    const body = c.req.valid('json');
    const event = await createEvent(user.sub, body);
    return created(c, event);
  });

  app.openapi(updateEventRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_events');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const event = await updateEvent(id, body);
    return ok(c, event);
  });

  app.openapi(deleteEventRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_events');
    const { id } = c.req.valid('param');
    const event = await cancelEvent(id);
    return ok(c, event);
  });

  app.openapi(registerEventRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    const registration = await register(id, user.sub);
    return created(c, registration);
  });

  app.openapi(unregisterEventRoute, async (c) => {
    const user = getUser(c);
    const { id } = c.req.valid('param');
    await unregister(id, user.sub);
    return ok(c, { message: 'Inscripción cancelada' });
  });
}
