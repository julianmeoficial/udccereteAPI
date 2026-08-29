import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const ResourceScopeSchema = z
  .enum(['institutional', 'program', 'internal'])
  .openapi('ResourceScope');

export const ResourceSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    programId: z.string().uuid().nullable(),
    courseId: z.string().uuid().nullable(),
    scope: ResourceScopeSchema,
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    publicUrl: z.string().url().nullable(),
    currentVersion: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('Resource');

export const ResourcesQuerySchema = PaginationQuerySchema.extend({
  programId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  scope: ResourceScopeSchema.optional(),
  mimeType: z.string().optional(),
  q: z.string().optional(),
}).openapi('ResourcesQuery');

export const CreateResourceSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    programId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    scope: ResourceScopeSchema.default('institutional'),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().max(26_214_400),
    filename: z.string().min(1),
  })
  .openapi('CreateResource');

export const UploadUrlResponseSchema = z
  .object({
    resourceId: z.string().uuid(),
    uploadUrl: z.string().url(),
    storageKey: z.string(),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .openapi('UploadUrlResponse');

export const DownloadUrlResponseSchema = z
  .object({
    downloadUrl: z.string().url(),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .openapi('DownloadUrlResponse');

export type Resource = z.infer<typeof ResourceSchema>;
