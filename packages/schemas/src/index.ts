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
