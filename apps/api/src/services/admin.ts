import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { analyticsEvents, auditLog, getDb, profiles, searchZeroResults } from '@udccerete/db';
import {
  AnalyticsSummarySchema,
  PaginationMetaSchema,
  type AdminUser,
  type AuditLogEntry,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type AdminUsersQuery = {
  page: number;
  pageSize: number;
  role?: 'super_admin' | 'admin' | 'editor' | 'teacher' | 'student' | 'visitor';
  centerId?: string;
};
type AuditQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  entityType?: string;
  action?: string;
};
type UpdateUserRole = {
  role: 'super_admin' | 'admin' | 'editor' | 'teacher' | 'student' | 'visitor';
  centerId?: string;
  programId?: string;
};
type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapAdminUser(row: typeof profiles.$inferSelect): AdminUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    centerId: row.centerId,
    programId: row.programId,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAuditEntry(row: typeof auditLog.$inferSelect): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    payload: row.payload ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildUsersWhere(query: AdminUsersQuery) {
  const conditions: SQL[] = [];
  if (query.role) conditions.push(eq(profiles.role, query.role));
  if (query.centerId) conditions.push(eq(profiles.centerId, query.centerId));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildAuditWhere(query: AuditQuery) {
  const conditions: SQL[] = [];
  if (query.entityType) conditions.push(eq(auditLog.entityType, query.entityType));
  if (query.action) {
    conditions.push(
      eq(
        auditLog.action,
        query.action as (typeof auditLog.$inferSelect)['action'],
      ),
    );
  }
  if (query.from) conditions.push(sql`${auditLog.createdAt} >= ${new Date(query.from)}`);
  if (query.to) conditions.push(sql`${auditLog.createdAt} <= ${new Date(query.to)}`);
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listUsers(
  query: AdminUsersQuery,
): Promise<{ items: AdminUser[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildUsersWhere(query);

  const countRows = await db
    .select({ total: count() })
    .from(profiles)
    .where(where ?? sql`true`);

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(profiles)
    .where(where ?? sql`true`)
    .orderBy(desc(profiles.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapAdminUser),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function updateUserRole(userId: string, input: UpdateUserRole): Promise<AdminUser> {
  const db = getDb();
  const [updated] = await db
    .update(profiles)
    .set({
      role: input.role,
      centerId: input.centerId ?? null,
      programId: input.programId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Usuario no encontrado');
  return mapAdminUser(updated);
}

export async function listAudit(
  query: AuditQuery,
): Promise<{ items: AuditLogEntry[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildAuditWhere(query);

  const countRows = await db
    .select({ total: count() })
    .from(auditLog)
    .where(where ?? sql`true`);

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(auditLog)
    .where(where ?? sql`true`)
    .orderBy(desc(auditLog.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapAuditEntry),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = getDb();

  const pageViewRows = await db
    .select({ totalPageViews: count() })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventType, 'page_view'));

  const totalPageViews = Number(pageViewRows[0]?.totalPageViews ?? 0);

  const topPages = await db
    .select({ path: analyticsEvents.path, count: count() })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.eventType, 'page_view'), sql`${analyticsEvents.path} is not null`))
    .groupBy(analyticsEvents.path)
    .orderBy(desc(count()))
    .limit(10);

  const topSearches = await db
    .select({ term: analyticsEvents.searchTerm, count: count() })
    .from(analyticsEvents)
    .where(
      and(eq(analyticsEvents.eventType, 'search'), sql`${analyticsEvents.searchTerm} is not null`),
    )
    .groupBy(analyticsEvents.searchTerm)
    .orderBy(desc(count()))
    .limit(10);

  const zeroResultSearches = await db
    .select({ query: searchZeroResults.query, count: count() })
    .from(searchZeroResults)
    .groupBy(searchZeroResults.query)
    .orderBy(desc(count()))
    .limit(10);

  const adoptionByProgram = await db
    .select({ programSlug: analyticsEvents.programSlug, activeUsers: count() })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.programSlug} is not null`)
    .groupBy(analyticsEvents.programSlug)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalPageViews,
    topPages: topPages.map((row) => ({
      path: row.path ?? '/',
      count: Number(row.count),
    })),
    topSearches: topSearches.map((row) => ({
      term: row.term ?? '',
      count: Number(row.count),
    })),
    zeroResultSearches: zeroResultSearches.map((row) => ({
      query: row.query,
      count: Number(row.count),
    })),
    adoptionByProgram: adoptionByProgram.map((row) => ({
      programSlug: row.programSlug ?? 'unknown',
      activeUsers: Number(row.activeUsers),
    })),
  };
}
