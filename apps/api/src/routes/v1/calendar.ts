import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import {
  CalendarActivitySchema,
  CalendarImportSchema,
  CalendarQuerySchema,
  CreateCalendarActivitySchema,
  IdParamSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  UpdateCalendarActivitySchema,
} from '@udccerete/schemas';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import {
  cancelActivity,
  createActivity,
  generateIcs,
  importCsv,
  listActivities,
  updateActivity,
} from '../../services/calendar.js';

const FeedTokenParamSchema = z
  .object({
    token: z.string().min(1).openapi({
      param: { name: 'token', in: 'path' },
      description: 'Token del feed de calendario',
    }),
  })
  .openapi('CalendarFeedTokenParam');

const listCalendarRoute = createRoute({
  method: 'get',
  path: '/calendar',
  tags: ['Calendar'],
  summary: 'Listar actividades del calendario',
  request: { query: CalendarQuerySchema },
  responses: {
    200: {
      description: 'Actividades paginadas',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema(CalendarActivitySchema, 'CalendarListResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const calendarIcsRoute = createRoute({
  method: 'get',
  path: '/calendar.ics',
  tags: ['Calendar'],
  summary: 'Exportar calendario en formato ICS',
  request: { query: CalendarQuerySchema },
  responses: {
    200: {
      description: 'Archivo iCalendar',
      content: { 'text/calendar': { schema: z.string().openapi({ type: 'string', format: 'binary' }) } },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const calendarFeedRoute = createRoute({
  method: 'get',
  path: '/calendar/feed/{token}',
  tags: ['Calendar'],
  summary: 'Feed ICS por token',
  request: { params: FeedTokenParamSchema },
  responses: {
    200: {
      description: 'Archivo iCalendar',
      content: { 'text/calendar': { schema: z.string().openapi({ type: 'string', format: 'binary' }) } },
    },
    404: { description: 'Token no válido', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createCalendarRoute = createRoute({
  method: 'post',
  path: '/calendar',
  tags: ['Calendar'],
  summary: 'Crear actividad',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateCalendarActivitySchema } } } },
  responses: {
    201: {
      description: 'Actividad creada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(CalendarActivitySchema, 'CalendarActivityResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const updateCalendarRoute = createRoute({
  method: 'patch',
  path: '/calendar/{id}',
  tags: ['Calendar'],
  summary: 'Actualizar actividad',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateCalendarActivitySchema } } },
  },
  responses: {
    200: {
      description: 'Actividad actualizada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(CalendarActivitySchema, 'CalendarActivityResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const deleteCalendarRoute = createRoute({
  method: 'delete',
  path: '/calendar/{id}',
  tags: ['Calendar'],
  summary: 'Cancelar actividad',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Actividad cancelada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(CalendarActivitySchema, 'CalendarActivityResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const importCalendarRoute = createRoute({
  method: 'post',
  path: '/calendar/import',
  tags: ['Calendar'],
  summary: 'Importar actividades desde CSV',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CalendarImportSchema } } } },
  responses: {
    200: {
      description: 'Importación completada',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(
            z
              .object({
                imported: z.number().int(),
                errors: z.array(z.string()),
              })
              .openapi('CalendarImportResult'),
            'CalendarImportResponse',
          ),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerCalendarRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/calendar', requireDatabase);
  app.use('/calendar.ics', requireDatabase);

  app.openapi(listCalendarRoute, async (c) => {
    const query = c.req.valid('query');
    const { items, pagination } = await listActivities(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(calendarIcsRoute, async (c) => {
    const query = c.req.valid('query');
    const { items } = await listActivities({ ...query, page: 1, pageSize: 500 });
    const ics = generateIcs(items);
    return c.body(ics, 200, { 'Content-Type': 'text/calendar; charset=utf-8' });
  });

  app.openapi(calendarFeedRoute, async (c) => {
    const { token: _token } = c.req.valid('param');
    const { items } = await listActivities({ page: 1, pageSize: 500 });
    const ics = generateIcs(items);
    return c.body(ics, 200, { 'Content-Type': 'text/calendar; charset=utf-8' });
  });

  app.openapi(createCalendarRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_calendar');
    const body = c.req.valid('json');
    const activity = await createActivity(user.sub, body);
    return created(c, activity);
  });

  app.openapi(updateCalendarRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_calendar');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const activity = await updateActivity(id, body);
    return ok(c, activity);
  });

  app.openapi(deleteCalendarRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_calendar');
    const { id } = c.req.valid('param');
    const activity = await cancelActivity(id);
    return ok(c, activity);
  });

  app.openapi(importCalendarRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'manage_calendar');
    const { csv } = c.req.valid('json');
    const result = await importCsv(csv, user.sub);
    return ok(c, result);
  });
}
