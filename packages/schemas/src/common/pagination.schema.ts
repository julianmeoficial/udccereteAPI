import { z } from '@hono/zod-openapi';
import { ResponseMetaSchema } from './response.schema.js';

export const PaginationQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .openapi({
        param: { name: 'page', in: 'query' },
        description: 'Número de página (desde 1)',
        example: 1,
      }),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .openapi({
        param: { name: 'pageSize', in: 'query' },
        description: 'Elementos por página (máximo 100)',
        example: 20,
      }),
  })
  .openapi('PaginationQuery');

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z
  .object({
    page: z.number().int().openapi({ example: 1, description: 'Página actual' }),
    pageSize: z.number().int().openapi({ example: 20, description: 'Tamaño de página' }),
    total: z.number().int().openapi({ example: 100, description: 'Total de elementos' }),
    totalPages: z.number().int().openapi({ example: 5, description: 'Total de páginas' }),
  })
  .openapi('PaginationMeta');

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const PaginatedMetaSchema = ResponseMetaSchema.extend({
  pagination: PaginationMetaSchema,
}).openapi('PaginatedMeta');

export type PaginatedMeta = z.infer<typeof PaginatedMetaSchema>;

/**
 * Respuesta paginada en el sobre transversal `{ data, meta }`.
 * `meta` incluye requestId, timestamp y pagination.
 */
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  name = 'PaginatedResponse',
) {
  return z
    .object({
      data: z.array(itemSchema),
      meta: PaginatedMetaSchema,
    })
    .openapi(name);
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};
