import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  CreateResourceSchema,
  DownloadUrlResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
  ResourceSchema,
  ResourcesQuerySchema,
  SuccessResponseSchema,
  UploadUrlResponseSchema,
} from '@udccerete/schemas';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { requireInstitutionalEmail, requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import {
  createResourceMetadata,
  getDownloadUrl,
  listResources,
} from '../../services/resources.js';

const listResourcesRoute = createRoute({
  method: 'get',
  path: '/resources',
  tags: ['Resources'],
  summary: 'Listar recursos',
  request: { query: ResourcesQuerySchema },
  responses: {
    200: {
      description: 'Recursos paginados',
      content: {
        'application/json': { schema: PaginatedResponseSchema(ResourceSchema, 'ResourcesListResponse') },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createResourceRoute = createRoute({
  method: 'post',
  path: '/resources',
  tags: ['Resources'],
  summary: 'Registrar metadatos de recurso y obtener URL de subida',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateResourceSchema } } } },
  responses: {
    201: {
      description: 'Metadatos creados',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(UploadUrlResponseSchema, 'UploadUrlApiResponse'),
        },
      },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso o correo no institucional', content: apiErrorJson },
    413: { description: 'Archivo demasiado grande', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const downloadResourceRoute = createRoute({
  method: 'get',
  path: '/resources/{id}/download',
  tags: ['Resources'],
  summary: 'Obtener URL de descarga firmada',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'URL de descarga',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(DownloadUrlResponseSchema, 'DownloadUrlApiResponse'),
        },
      },
    },
    404: { description: 'No encontrado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerResourcesRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/resources', requireDatabase);
  app.use('/resources/*', requireDatabase);

  app.openapi(listResourcesRoute, async (c) => {
    const query = c.req.valid('query');
    const { items, pagination } = await listResources(query);
    return okPaginated(c, items, pagination);
  });

  app.openapi(createResourceRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'upload_resource');
    requireInstitutionalEmail(user.email);
    const body = c.req.valid('json');
    const upload = await createResourceMetadata(user.sub, body);
    return created(c, upload);
  });

  app.openapi(downloadResourceRoute, async (c) => {
    const { id } = c.req.valid('param');
    const download = await getDownloadUrl(id);
    return ok(c, download);
  });
}
