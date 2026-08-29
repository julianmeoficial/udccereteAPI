import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const AuditLogEntrySchema = z
  .object({
    id: z.string().uuid(),
    actorId: z.string().uuid().nullable(),
    action: z.enum(['create', 'update', 'delete', 'archive', 'moderate', 'publish', 'cancel']),
    entityType: z.string(),
    entityId: z.string().uuid().nullable(),
    payload: z.record(z.unknown()).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .openapi('AuditLogEntry');

export const AuditQuerySchema = PaginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
}).openapi('AuditQuery');

export const AnalyticsSummarySchema = z
  .object({
    totalPageViews: z.number().int(),
    topPages: z.array(z.object({ path: z.string(), count: z.number().int() })),
    topSearches: z.array(z.object({ term: z.string(), count: z.number().int() })),
    zeroResultSearches: z.array(z.object({ query: z.string(), count: z.number().int() })),
    adoptionByProgram: z.array(
      z.object({ programSlug: z.string(), activeUsers: z.number().int() }),
    ),
  })
  .openapi('AnalyticsSummary');

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
