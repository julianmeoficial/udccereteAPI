import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';
import { ModerationStatusSchema } from '../comments/index.js';

export const ForumTargetTypeSchema = z.enum(['course', 'tutor']).openapi('ForumTargetType');

export const ForumOpinionSchema = z
  .object({
    id: z.string().uuid(),
    targetType: ForumTargetTypeSchema,
    courseId: z.string().uuid().nullable(),
    tutorId: z.string().uuid().nullable(),
    rating: z.number().int().min(1).max(5),
    body: z.string(),
    moderationStatus: ModerationStatusSchema,
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .openapi('ForumOpinion');

export const ForumSummarySchema = z
  .object({
    targetType: ForumTargetTypeSchema,
    targetId: z.string().uuid(),
    averageRating: z.number(),
    count: z.number().int(),
  })
  .openapi('ForumSummary');

export const ForumQuerySchema = PaginationQuerySchema.extend({
  targetType: ForumTargetTypeSchema.optional(),
  courseId: z.string().uuid().optional(),
  tutorId: z.string().uuid().optional(),
}).openapi('ForumQuery');

export const CreateForumOpinionSchema = z
  .object({
    targetType: ForumTargetTypeSchema,
    courseId: z.string().uuid().optional(),
    tutorId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    body: z.string().min(10).max(2000),
  })
  .refine(
    (v) =>
      (v.targetType === 'course' && v.courseId) || (v.targetType === 'tutor' && v.tutorId),
    { message: 'courseId o tutorId requerido según targetType' },
  )
  .openapi('CreateForumOpinion');

export const ModerateForumOpinionSchema = z
  .object({ moderationStatus: ModerationStatusSchema })
  .openapi('ModerateForumOpinion');

export type ForumOpinion = z.infer<typeof ForumOpinionSchema>;
