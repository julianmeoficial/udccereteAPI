import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import {
  ProfileSchema,
  SuccessResponseSchema,
  UpdateProfileSchema,
} from '@udccerete/schemas';
import { ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import { getOrCreateProfile, requestAccountDeletion, updateProfile } from '../../services/me.js';
import { enqueueUserPurge } from '../../lib/queue.js';

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Session'],
  summary: 'Perfil del usuario autenticado',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Perfil',
      content: { 'application/json': { schema: SuccessResponseSchema(ProfileSchema, 'MeResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const patchMeRoute = createRoute({
  method: 'patch',
  path: '/me',
  tags: ['Session'],
  summary: 'Actualizar perfil',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateProfileSchema } } } },
  responses: {
    200: {
      description: 'Perfil actualizado',
      content: { 'application/json': { schema: SuccessResponseSchema(ProfileSchema, 'MeResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
  },
});

const DeleteMeResponseSchema = SuccessResponseSchema(
  z
    .object({
      message: z.string(),
      scheduledAt: z.string().datetime({ offset: true }),
    })
    .openapi('DeleteMeResponse'),
);

const deleteMeRoute = createRoute({
  method: 'delete',
  path: '/me',
  tags: ['Session'],
  summary: 'Solicitar eliminación de cuenta',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Eliminación programada',
      content: { 'application/json': { schema: DeleteMeResponseSchema } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
  },
});

export function registerMeRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/me', requireAuth, requireDatabase);

  app.openapi(getMeRoute, async (c) => {
    const user = getUser(c);
    const profile = await getOrCreateProfile(user);
    return ok(c, profile);
  });

  app.openapi(patchMeRoute, async (c) => {
    const user = getUser(c);
    const body = c.req.valid('json');
    const profile = await updateProfile(user, body);
    return ok(c, profile);
  });

  app.openapi(deleteMeRoute, async (c) => {
    const user = getUser(c);
    const result = await requestAccountDeletion(user);
    await enqueueUserPurge({ userId: user.sub, scheduledAt: result.scheduledAt });
    return ok(c, {
      message: 'Eliminación de cuenta programada',
      scheduledAt: result.scheduledAt,
    });
  });
}
