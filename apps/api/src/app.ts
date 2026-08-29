import { OpenAPIHono } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { env } from './env.js';
import { optionalAuth } from './middleware/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { validationHook } from './middleware/validation.js';
import { registerOpenApi } from './openapi.js';
import { registerFeedRoutes } from './routes/feed.js';
import { registerRootHealth } from './routes/health.js';
import { createV1Router } from './routes/v1/index.js';
import type { AppBindings } from './types.js';

export function createApp() {
  const app = new OpenAPIHono<AppBindings>({
    defaultHook: validationHook,
  });

  app.use(requestIdMiddleware);
  if (env.NODE_ENV !== 'test') {
    app.use(logger());
  }
  app.use(corsMiddleware);
  app.use(optionalAuth);
  app.use('/api/*', rateLimitMiddleware);

  registerRootHealth(app);
  registerFeedRoutes(app);
  app.route('/api/v1', createV1Router());
  registerOpenApi(app);

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}

export type App = ReturnType<typeof createApp>;
