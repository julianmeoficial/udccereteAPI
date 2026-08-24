import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from '../../types.js';
import { registerHealthRoutes } from './health.js';
import { registerMetaRoutes } from './meta.js';

export function createV1Router() {
  const v1 = new OpenAPIHono<AppBindings>();
  registerHealthRoutes(v1);
  registerMetaRoutes(v1);
  return v1;
}
