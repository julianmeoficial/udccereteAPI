import { and, count, desc, eq, inArray } from 'drizzle-orm';
import {
  categories,
  getDb,
  postTags,
  posts,
  profiles,
  readReceipts,
  savedPosts,
  tags,
} from '@udccerete/db';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
  type Post,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

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

function mapCategory(row: typeof categories.$inferSelect | null): PostSummary['category'] {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, description: row.description };
}

function mapPostSummary(row: PostRow, tagList: Post['tags']): PostSummary {
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

async function loadTagsByPostIds(postIds: string[]): Promise<Map<string, Post['tags']>> {
  const map = new Map<string, Post['tags']>();
  if (postIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({ postId: postTags.postId, tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.tag.id, name: row.tag.name, slug: row.tag.slug });
    map.set(row.postId, list);
  }
  return map;
}

export async function listSaved(
  profileId: string,
  query: PaginationQuery,
): Promise<{ items: PostSummary[]; pagination: PaginationMeta }> {
  const db = getDb();

  const countRows = await db
    .select({ total: count() })
    .from(savedPosts)
    .where(eq(savedPosts.profileId, profileId));

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select({ post: posts, author: profiles, category: categories, savedAt: savedPosts.savedAt })
    .from(savedPosts)
    .innerJoin(posts, eq(savedPosts.postId, posts.id))
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(savedPosts.profileId, profileId))
    .orderBy(desc(savedPosts.savedAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  const tagMap = await loadTagsByPostIds(rows.map((r) => r.post.id));
  const items = rows.map((row) =>
    mapPostSummary(
      { post: row.post, author: row.author, category: row.category },
      tagMap.get(row.post.id) ?? [],
    ),
  );

  return { items, pagination: paginationMeta(query.page, query.pageSize, total) };
}

export async function savePost(
  profileId: string,
  postId: string,
): Promise<{ savedAt: string }> {
  const db = getDb();

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw new AppError('NOT_FOUND', 'Publicación no encontrada');

  const [saved] = await db
    .insert(savedPosts)
    .values({ profileId, postId })
    .onConflictDoUpdate({
      target: [savedPosts.profileId, savedPosts.postId],
      set: { savedAt: new Date() },
    })
    .returning();

  if (!saved) throw new AppError('INTERNAL_ERROR', 'No se pudo guardar la publicación');
  return { savedAt: saved.savedAt.toISOString() };
}

export async function unsavePost(profileId: string, postId: string): Promise<void> {
  const db = getDb();
  const [deleted] = await db
    .delete(savedPosts)
    .where(and(eq(savedPosts.profileId, profileId), eq(savedPosts.postId, postId)))
    .returning();

  if (!deleted) throw new AppError('NOT_FOUND', 'Publicación guardada no encontrada');
}

export async function markRead(
  profileId: string,
  postId: string,
): Promise<{ readAt: string }> {
  const db = getDb();

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw new AppError('NOT_FOUND', 'Publicación no encontrada');

  const [receipt] = await db
    .insert(readReceipts)
    .values({ profileId, postId })
    .onConflictDoUpdate({
      target: [readReceipts.profileId, readReceipts.postId],
      set: { readAt: new Date() },
    })
    .returning();

  if (!receipt) throw new AppError('INTERNAL_ERROR', 'No se pudo registrar la lectura');
  return { readAt: receipt.readAt.toISOString() };
}
