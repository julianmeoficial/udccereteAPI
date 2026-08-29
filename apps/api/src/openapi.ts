import { swaggerUI } from '@hono/swagger-ui';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { API_NAME, apiVersion } from './env.js';
import type { AppBindings } from './types.js';

export function registerOpenApi(app: OpenAPIHono<AppBindings>) {
  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT emitido por Supabase Auth',
  });

  app.doc31('/doc', {
    openapi: '3.1.0',
    info: {
      title: API_NAME,
      version: apiVersion,
      description:
        'API pública del Blog UDEC Cereté. Contrato v1 bajo /api/v1. Los esquemas viven en @udccerete/schemas.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
  });

  app.get('/ui', swaggerUI({ url: '/doc' }));
}
