import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { commentReports, comments, getDb, profiles } from '@udccerete/db';
import {
  CommentsQuerySchema,
  CreateCommentSchema,
  ModerateCommentSchema,
  PaginationMetaSchema,
  ReportCommentSchema,
  type Comment,
  type CommentWithReplies,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type CommentsQuery = z.infer<typeof CommentsQuerySchema>;
type CreateComment = z.infer<typeof CreateCommentSchema>;
type ModerateComment = z.infer<typeof ModerateCommentSchema>;
type ReportComment = z.infer<typeof ReportCommentSchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

type CommentRow = {
  comment: typeof comments.$inferSelect;
  author: typeof profiles.$inferSelect;
};

function mapComment(row: CommentRow, replies: CommentWithReplies[] = []): CommentWithReplies {
  return {
    id: row.comment.id,
    postId: row.comment.postId,
    parentId: row.comment.parentId,
    body: row.comment.body,
    author: {
      id: row.author.id,
      fullName: row.author.fullName,
    },
    moderationStatus: row.comment.moderationStatus,
    createdAt: row.comment.createdAt.toISOString(),
    updatedAt: row.comment.updatedAt.toISOString(),
    replies: replies.length > 0 ? replies : undefined,
  };
}

async function fetchCommentRow(commentId: string): Promise<CommentRow> {
  const db = getDb();
  const [row] = await db
    .select({ comment: comments, author: profiles })
    .from(comments)
    .innerJoin(profiles, eq(comments.authorId, profiles.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!row) throw new AppError('NOT_FOUND', 'Comentario no encontrado');
  return row;
}

async function loadReplies(parentIds: string[]): Promise<Map<string, CommentWithReplies[]>> {
  const map = new Map<string, CommentWithReplies[]>();
  if (parentIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({ comment: comments, author: profiles })
    .from(comments)
    .innerJoin(profiles, eq(comments.authorId, profiles.id))
    .where(and(inArray(comments.parentId, parentIds), eq(comments.moderationStatus, 'approved')))
    .orderBy(asc(comments.createdAt));

  for (const row of rows) {
    const parentId = row.comment.parentId!;
    const list = map.get(parentId) ?? [];
    list.push(mapComment(row));
    map.set(parentId, list);
  }
  return map;
}

export async function listComments(
  postId: string,
  query: CommentsQuery,
): Promise<{ items: Comment[]; pagination: PaginationMeta }> {
  const db = getDb();

  const countRows = await db
    .select({ total: count() })
    .from(comments)
    .where(
      and(
        eq(comments.postId, postId),
        isNull(comments.parentId),
        eq(comments.moderationStatus, 'approved'),
      ),
    );

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select({ comment: comments, author: profiles })
    .from(comments)
    .innerJoin(profiles, eq(comments.authorId, profiles.id))
    .where(
      and(
        eq(comments.postId, postId),
        isNull(comments.parentId),
        eq(comments.moderationStatus, 'approved'),
      ),
    )
    .orderBy(desc(comments.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  const replyMap = await loadReplies(rows.map((r) => r.comment.id));
  const items = rows.map((row) => mapComment(row, replyMap.get(row.comment.id) ?? []));

  return { items, pagination: paginationMeta(query.page, query.pageSize, total) };
}

export async function createComment(
  postId: string,
  authorId: string,
  input: CreateComment,
): Promise<Comment> {
  const db = getDb();

  if (input.parentId) {
    const [parent] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, input.parentId), eq(comments.postId, postId)))
      .limit(1);
    if (!parent) throw new AppError('NOT_FOUND', 'Comentario padre no encontrado');
  }

  const [created] = await db
    .insert(comments)
    .values({
      postId,
      authorId,
      parentId: input.parentId ?? null,
      body: input.body,
      moderationStatus: 'approved',
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear el comentario');

  const row = await fetchCommentRow(created.id);
  return mapComment(row);
}

export async function moderateComment(
  commentId: string,
  input: ModerateComment,
): Promise<Comment> {
  const db = getDb();
  const now = new Date();
  const hiddenAt = input.moderationStatus === 'hidden' ? now : null;

  const [updated] = await db
    .update(comments)
    .set({
      moderationStatus: input.moderationStatus,
      hiddenAt,
      updatedAt: now,
    })
    .where(eq(comments.id, commentId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Comentario no encontrado');

  const row = await fetchCommentRow(commentId);
  return mapComment(row);
}

export async function reportComment(
  commentId: string,
  reporterId: string,
  input: ReportComment,
): Promise<{ reportCount: number; autoHidden: boolean }> {
  const db = getDb();

  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment) throw new AppError('NOT_FOUND', 'Comentario no encontrado');

  await db.insert(commentReports).values({
    commentId,
    reporterId,
    reason: input.reason ?? null,
  });

  const countRows = await db
    .select({ reportCount: count() })
    .from(commentReports)
    .where(eq(commentReports.commentId, commentId));

  const totalReports = Number(countRows[0]?.reportCount ?? 0);
  let autoHidden = false;

  if (totalReports >= 2 && comment.moderationStatus !== 'hidden') {
    const now = new Date();
    await db
      .update(comments)
      .set({ moderationStatus: 'hidden', hiddenAt: now, updatedAt: now })
      .where(eq(comments.id, commentId));
    autoHidden = true;
  }

  return { reportCount: totalReports, autoHidden };
}
