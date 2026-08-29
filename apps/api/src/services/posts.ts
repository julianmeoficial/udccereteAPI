import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import {
  categories,
  getDb,
  postTags,
  posts,
  profiles,
  tags,
} from '@udccerete/db';
import {
  CategorySchema,
  PaginationMetaSchema,
  TagSchema,
  type Post,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';
import { slugify } from '../lib/slug.js';

type PostsQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  category?: string;
  tag?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  q?: string;
};
type CreatePost = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  categoryId?: string;
  tagIds?: string[];
  area?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: string;
};
type UpdatePost = Partial<CreatePost>;
type Category = z.infer<typeof CategorySchema>;
type Tag = z.infer<typeof TagSchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

type PostSummary = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'coverImageUrl'
  | 'author'
  | 'area'
  | 'status'
  | 'publishedAt'
  | 'createdAt'
> & {
  category: Post['category'];
  tags: Post['tags'];
};

type PostRow = {
  post: typeof posts.$inferSelect;
  author: typeof profiles.$inferSelect;
  category: typeof categories.$inferSelect | null;
};

function mapCategory(row: typeof categories.$inferSelect | null): Category | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

function mapTag(row: typeof tags.$inferSelect): Tag {
  return { id: row.id, name: row.name, slug: row.slug };
}

function mapPostSummary(row: PostRow, tagList: Tag[]): PostSummary {
  return {
    id: row.post.id,
    title: row.post.title,
    slug: row.post.slug,
    excerpt: row.post.excerpt,
    coverImageUrl: row.post.coverImageUrl,
    category: mapCategory(row.category),
    tags: tagList,
    author: {
      id: row.author.id,
      fullName: row.author.fullName,
      area: row.post.area,
    },
    area: row.post.area,
    status: row.post.status,
    publishedAt: row.post.publishedAt?.toISOString() ?? null,
    createdAt: row.post.createdAt.toISOString(),
  };
}

function mapPost(row: PostRow, tagList: Tag[]): Post {
  return {
    ...mapPostSummary(row, tagList),
    content: row.post.content,
    updatedAt: row.post.updatedAt.toISOString(),
  };
}

async function loadTagsByPostIds(postIds: string[]): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>();
  if (postIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({ postId: postTags.postId, tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push(mapTag(row.tag));
    map.set(row.postId, list);
  }
  return map;
}

function buildPostsWhere(query: PostsQuery) {
  const conditions: SQL[] = [];

  if (query.status) {
    conditions.push(eq(posts.status, query.status));
  }
  if (query.category) {
    conditions.push(eq(categories.slug, query.category));
  }
  if (query.tag) {
    conditions.push(eq(tags.slug, query.tag));
  }
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern))!);
  }
  if (query.from) {
    conditions.push(sql`${posts.publishedAt} >= ${new Date(query.from)}`);
  }
  if (query.to) {
    conditions.push(sql`${posts.publishedAt} <= ${new Date(query.to)}`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

async function fetchPostRow(postId: string): Promise<PostRow> {
  const db = getDb();
  const [row] = await db
    .select({ post: posts, author: profiles, category: categories })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (!row) throw new AppError('NOT_FOUND', 'Publicación no encontrada');
  return row;
}

async function fetchPostRowBySlug(slug: string): Promise<PostRow> {
  const db = getDb();
  const [row] = await db
    .select({ post: posts, author: profiles, category: categories })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!row) throw new AppError('NOT_FOUND', 'Publicación no encontrada');
  return row;
}

async function syncPostTags(postId: string, tagIds: string[] | undefined) {
  if (tagIds === undefined) return;
  const db = getDb();
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length === 0) return;
  await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
}

export async function listPosts(
  query: PostsQuery,
): Promise<{ items: PostSummary[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildPostsWhere(query);
  const needsTagJoin = Boolean(query.tag);

  const baseFrom = db
    .select({ post: posts, author: profiles, category: categories })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id));

  const fromQuery = needsTagJoin
    ? baseFrom
        .innerJoin(postTags, eq(postTags.postId, posts.id))
        .innerJoin(tags, eq(postTags.tagId, tags.id))
    : baseFrom;

  const countRows = await db
    .select({ total: count() })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(where ?? sql`true`);

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await fromQuery
    .where(where ?? sql`true`)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  const tagMap = await loadTagsByPostIds(rows.map((r) => r.post.id));
  const items = rows.map((row) => mapPostSummary(row, tagMap.get(row.post.id) ?? []));

  return { items, pagination: paginationMeta(query.page, query.pageSize, total) };
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const row = await fetchPostRowBySlug(slug);
  const tagMap = await loadTagsByPostIds([row.post.id]);
  return mapPost(row, tagMap.get(row.post.id) ?? []);
}

export async function createPost(authorId: string, input: CreatePost): Promise<Post> {
  const db = getDb();
  const slug = input.slug ?? slugify(input.title);
  const now = new Date();
  const publishedAt =
    input.status === 'published' ? now : input.scheduledAt ? new Date(input.scheduledAt) : null;

  const [created] = await db
    .insert(posts)
    .values({
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      coverImageUrl: input.coverImageUrl ?? null,
      categoryId: input.categoryId ?? null,
      authorId,
      area: input.area ?? null,
      status: input.status,
      publishedAt,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear la publicación');

  await syncPostTags(created.id, input.tagIds ?? []);
  const row = await fetchPostRow(created.id);
  const tagMap = await loadTagsByPostIds([created.id]);
  return mapPost(row, tagMap.get(created.id) ?? []);
}

export async function updatePost(postId: string, input: UpdatePost): Promise<Post> {
  const db = getDb();
  const existing = await fetchPostRow(postId);
  const now = new Date();

  const nextStatus = input.status ?? existing.post.status;
  const publishedAt =
    nextStatus === 'published' && !existing.post.publishedAt
      ? now
      : existing.post.publishedAt;

  const [updated] = await db
    .update(posts)
    .set({
      title: input.title ?? existing.post.title,
      slug: input.slug ?? existing.post.slug,
      excerpt: input.excerpt !== undefined ? input.excerpt ?? null : existing.post.excerpt,
      content: input.content ?? existing.post.content,
      coverImageUrl:
        input.coverImageUrl !== undefined ? input.coverImageUrl ?? null : existing.post.coverImageUrl,
      categoryId:
        input.categoryId !== undefined ? input.categoryId ?? null : existing.post.categoryId,
      area: input.area !== undefined ? input.area ?? null : existing.post.area,
      status: nextStatus,
      publishedAt,
      scheduledAt:
        input.scheduledAt !== undefined
          ? input.scheduledAt
            ? new Date(input.scheduledAt)
            : null
          : existing.post.scheduledAt,
      updatedAt: now,
    })
    .where(eq(posts.id, postId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Publicación no encontrada');

  await syncPostTags(postId, input.tagIds);
  const row = await fetchPostRow(postId);
  const tagMap = await loadTagsByPostIds([postId]);
  return mapPost(row, tagMap.get(postId) ?? []);
}

export async function archivePost(postId: string): Promise<Post> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(posts)
    .set({ status: 'archived', archivedAt: now, updatedAt: now })
    .where(eq(posts.id, postId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Publicación no encontrada');

  const row = await fetchPostRow(postId);
  const tagMap = await loadTagsByPostIds([postId]);
  return mapPost(row, tagMap.get(postId) ?? []);
}

export async function listCategories(): Promise<Category[]> {
  const db = getDb();
  const rows = await db.select().from(categories).orderBy(asc(categories.name));
  return rows.map((row) => mapCategory(row)!);
}

export async function listTags(): Promise<Tag[]> {
  const db = getDb();
  const rows = await db.select().from(tags).orderBy(asc(tags.name));
  return rows.map(mapTag);
}
