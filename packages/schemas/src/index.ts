/**
 * Contratos Zod + OpenAPI compartidos entre API, workers y clientes.
 * Un esquema genera validación, tipos TypeScript, Swagger y (más adelante) el SDK.
 */
export { z } from '@hono/zod-openapi';

export * from './common/error.schema.js';
export * from './common/pagination.schema.js';
export * from './common/response.schema.js';
export * from './common/params.schema.js';
export * from './common/query.schema.js';
export * from './common/role.schema.js';
export * from './common/file.schema.js';

export * from './auth/index.js';
export * from './posts/index.js';
export * from './users/index.js';
export * from './comments/index.js';
export * from './calendar/index.js';
export * from './events/index.js';
export * from './resources/index.js';
export * from './forum/index.js';
export * from './notifications/index.js';
export * from './wellbeing/index.js';
export * from './citations/index.js';
export * from './admin/index.js';
export * from './search/index.js';
export * from './ai/index.js';
