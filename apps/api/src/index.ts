/**
 * API v1 — Hono 4
 * REST público bajo /api/v1, tRPC interno y webhooks.
 */
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { API_NAME, apiVersion, env } from './env.js';

const app = createApp();

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: env.PORT }, (info) => {
  const base = `http://localhost:${info.port}`;
  console.info(`${API_NAME} v${apiVersion} [${env.NODE_ENV}]`);
  console.info(`Health:     ${base}/health`);
  console.info(`API v1:     ${base}/api/v1/health`);
  console.info(`Meta:       ${base}/api/v1/meta`);
  console.info(`OpenAPI:    ${base}/doc`);
  console.info(`Swagger UI: ${base}/ui`);
});

export { app };
