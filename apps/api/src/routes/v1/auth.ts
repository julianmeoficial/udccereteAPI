import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  AuthSessionSchema,
  ExchangeSessionRequestSchema,
  GoogleAuthRequestSchema,
  MagicLinkRequestSchema,
  MagicLinkSentSchema,
  OAuthUrlSchema,
  SuccessResponseSchema,
  VerifyOtpRequestSchema,
} from '@udccerete/schemas';
import { accepted, ok } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import type { AppBindings } from '../../types.js';
import {
  exchangeSession,
  sendMagicLink,
  startGoogleOAuth,
  verifyOtp,
} from '../../services/auth.js';

const magicLinkRoute = createRoute({
  method: 'post',
  path: '/auth/magic-link',
  tags: ['Auth'],
  summary: 'Enviar Magic Link por correo',
  request: {
    body: { content: { 'application/json': { schema: MagicLinkRequestSchema } } },
  },
  responses: {
    202: {
      description: 'Solicitud aceptada; el correo se envía vía Supabase Auth',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(MagicLinkSentSchema, 'MagicLinkSentResponse'),
        },
      },
    },
    400: { description: 'Datos inválidos', content: apiErrorJson },
    503: { description: 'Autenticación no configurada', content: apiErrorJson },
  },
});

const googleAuthRoute = createRoute({
  method: 'post',
  path: '/auth/google',
  tags: ['Auth'],
  summary: 'Iniciar OAuth con Google',
  request: {
    body: { content: { 'application/json': { schema: GoogleAuthRequestSchema } } },
  },
  responses: {
    200: {
      description: 'URL de autorización de Google',
      content: {
        'application/json': { schema: SuccessResponseSchema(OAuthUrlSchema, 'GoogleOAuthResponse') },
      },
    },
    503: { description: 'Autenticación no configurada', content: apiErrorJson },
  },
});

const verifyOtpRoute = createRoute({
  method: 'post',
  path: '/auth/verify',
  tags: ['Auth'],
  summary: 'Verificar OTP de 6 dígitos',
  request: {
    body: { content: { 'application/json': { schema: VerifyOtpRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Sesión emitida',
      content: {
        'application/json': { schema: SuccessResponseSchema(AuthSessionSchema, 'AuthSessionResponse') },
      },
    },
    401: { description: 'Código inválido o expirado', content: apiErrorJson },
    503: { description: 'Autenticación no configurada', content: apiErrorJson },
  },
});

const exchangeSessionRoute = createRoute({
  method: 'post',
  path: '/auth/session',
  tags: ['Auth'],
  summary: 'Intercambiar código PKCE por sesión',
  request: {
    body: { content: { 'application/json': { schema: ExchangeSessionRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Sesión emitida',
      content: {
        'application/json': { schema: SuccessResponseSchema(AuthSessionSchema, 'AuthSessionResponse') },
      },
    },
    401: { description: 'Código inválido o expirado', content: apiErrorJson },
    503: { description: 'Autenticación no configurada', content: apiErrorJson },
  },
});

export function registerAuthRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(magicLinkRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await sendMagicLink(body);
    return accepted(c, result);
  });

  app.openapi(googleAuthRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await startGoogleOAuth(body);
    return ok(c, result);
  });

  app.openapi(verifyOtpRoute, async (c) => {
    const body = c.req.valid('json');
    const session = await verifyOtp(body);
    return ok(c, session);
  });

  app.openapi(exchangeSessionRoute, async (c) => {
    const body = c.req.valid('json');
    const session = await exchangeSession(body);
    return ok(c, session);
  });
}
