import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const PostStatusSchema = z
  .enum(['draft', 'scheduled', 'published', 'archived'])
  .openapi('PostStatus');

export const CategorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
  })
  .openapi('Category');

export const TagSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  })
  .openapi('Tag');

export const PostAuthorSchema = z
  .object({
    id: z.string().uuid(),
    fullName: z.string(),
    area: z.string().nullable().optional(),
  })
  .openapi('PostAuthor');

export const PostSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    content: z.string(),
    coverImageUrl: z.string().url().nullable(),
    category: CategorySchema.nullable(),
    tags: z.array(TagSchema),
    author: PostAuthorSchema,
    area: z.string().nullable(),
    status: PostStatusSchema,
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('Post');

export const PostSummarySchema = PostSchema.pick({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  author: true,
  area: true,
  status: true,
  publishedAt: true,
  createdAt: true,
}).extend({
  category: CategorySchema.nullable(),
  tags: z.array(TagSchema),
});

export const PostsQuerySchema = PaginationQuerySchema.extend({
  from: z
    .string()
    .datetime({ offset: true })
    .optional()
    .openapi({ param: { name: 'from', in: 'query' }, description: 'Inicio del rango' }),
  to: z
    .string()
    .datetime({ offset: true })
    .optional()
    .openapi({ param: { name: 'to', in: 'query' }, description: 'Fin del rango' }),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: PostStatusSchema.optional(),
  q: z.string().optional(),
}).openapi('PostsQuery');

export const CreatePostSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1),
    coverImageUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    area: z.string().optional(),
    status: PostStatusSchema.default('draft'),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
  })
  .openapi('CreatePost');

export const UpdatePostSchema = CreatePostSchema.partial().openapi('UpdatePost');

export type Post = z.infer<typeof PostSchema>;
export type PostsQuery = z.infer<typeof PostsQuerySchema>;
