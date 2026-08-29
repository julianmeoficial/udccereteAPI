import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const ModerationStatusSchema = z
  .enum(['pending', 'approved', 'hidden', 'rejected'])
  .openapi('ModerationStatus');

export const CommentAuthorSchema = z
  .object({
    id: z.string().uuid(),
    fullName: z.string(),
  })
  .openapi('CommentAuthor');

export const CommentSchema = z
  .object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    body: z.string(),
    author: CommentAuthorSchema,
    moderationStatus: ModerationStatusSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('Comment');

export const CommentWithRepliesSchema = CommentSchema.extend({
  replies: z.array(CommentSchema).optional(),
}).openapi('CommentWithReplies');

export const CommentsQuerySchema = PaginationQuerySchema.openapi('CommentsQuery');

export const CreateCommentSchema = z
  .object({
    body: z.string().min(1).max(5000),
    parentId: z.string().uuid().optional(),
  })
  .openapi('CreateComment');

export const ReportCommentSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .openapi('ReportComment');

export const ModerateCommentSchema = z
  .object({
    moderationStatus: ModerationStatusSchema,
  })
  .openapi('ModerateComment');

export type Comment = z.infer<typeof CommentSchema>;
export type CommentWithReplies = z.infer<typeof CommentWithRepliesSchema>;
