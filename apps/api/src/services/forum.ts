import { and, avg, count, desc, eq } from 'drizzle-orm';
import { forumOpinions, getDb } from '@udccerete/db';
import {
  CreateForumOpinionSchema,
  ForumQuerySchema,
  ForumSummarySchema,
  ModerateForumOpinionSchema,
  PaginationMetaSchema,
  type ForumOpinion,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type CreateForumOpinion = z.infer<typeof CreateForumOpinionSchema>;
type ForumQuery = z.infer<typeof ForumQuerySchema>;
type ForumSummary = z.infer<typeof ForumSummarySchema>;
type ModerateForumOpinion = z.infer<typeof ModerateForumOpinionSchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapOpinion(row: typeof forumOpinions.$inferSelect): ForumOpinion {
  return {
    id: row.id,
    targetType: row.targetType,
    courseId: row.courseId,
    tutorId: row.tutorId,
    rating: row.rating,
    body: row.body,
    moderationStatus: row.moderationStatus,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildForumWhere(query: ForumQuery) {
  const conditions = [eq(forumOpinions.moderationStatus, 'approved')];

  if (query.targetType) conditions.push(eq(forumOpinions.targetType, query.targetType));
  if (query.courseId) conditions.push(eq(forumOpinions.courseId, query.courseId));
  if (query.tutorId) conditions.push(eq(forumOpinions.tutorId, query.tutorId));

  return and(...conditions);
}

export async function listOpinions(
  query: ForumQuery,
): Promise<{ items: ForumOpinion[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildForumWhere(query);

  const countRows = await db.select({ total: count() }).from(forumOpinions).where(where);
  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(forumOpinions)
    .where(where)
    .orderBy(desc(forumOpinions.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapOpinion),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createOpinion(input: CreateForumOpinion): Promise<ForumOpinion> {
  const db = getDb();

  const [created] = await db
    .insert(forumOpinions)
    .values({
      targetType: input.targetType,
      courseId: input.targetType === 'course' ? input.courseId ?? null : null,
      tutorId: input.targetType === 'tutor' ? input.tutorId ?? null : null,
      rating: input.rating,
      body: input.body,
      moderationStatus: 'pending',
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear la opinión');
  return mapOpinion(created);
}

export async function getSummary(
  targetType: ForumSummary['targetType'],
  targetId: string,
): Promise<ForumSummary> {
  const db = getDb();
  const targetCondition =
    targetType === 'course'
      ? eq(forumOpinions.courseId, targetId)
      : eq(forumOpinions.tutorId, targetId);

  const [result] = await db
    .select({
      averageRating: avg(forumOpinions.rating),
      count: count(),
    })
    .from(forumOpinions)
    .where(and(eq(forumOpinions.targetType, targetType), targetCondition, eq(forumOpinions.moderationStatus, 'approved')));

  return {
    targetType,
    targetId,
    averageRating: result?.averageRating ? Number(result.averageRating) : 0,
    count: Number(result?.count ?? 0),
  };
}

export async function moderateOpinion(
  opinionId: string,
  input: ModerateForumOpinion,
): Promise<ForumOpinion> {
  const db = getDb();
  const now = new Date();
  const publishedAt = input.moderationStatus === 'approved' ? now : null;

  const [updated] = await db
    .update(forumOpinions)
    .set({
      moderationStatus: input.moderationStatus,
      publishedAt,
      updatedAt: now,
    })
    .where(eq(forumOpinions.id, opinionId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Opinión no encontrada');
  return mapOpinion(updated);
}
