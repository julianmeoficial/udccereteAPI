import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const SearchResultTypeSchema = z
  .enum(['post', 'resource', 'event', 'calendar', 'wellbeing'])
  .openapi('SearchResultType');

export const SearchResultSchema = z
  .object({
    type: SearchResultTypeSchema,
    id: z.string().uuid(),
    title: z.string(),
    excerpt: z.string().nullable(),
    url: z.string(),
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    highlights: z.array(z.string()).optional(),
  })
  .openapi('SearchResult');

export const SearchQuerySchema = PaginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  q: z.string().min(1),
  type: SearchResultTypeSchema.optional(),
  category: z.string().optional(),
  programId: z.string().uuid().optional(),
}).openapi('SearchQuery');

export const SearchResponseSchema = z
  .object({
    results: z.array(SearchResultSchema),
    degraded: z.boolean().optional(),
    warning: z.string().optional(),
  })
  .openapi('SearchResponse');

export type SearchResult = z.infer<typeof SearchResultSchema>;
