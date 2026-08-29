import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { getDb, resources } from '@udccerete/db';
import {
  CreateResourceSchema,
  DownloadUrlResponseSchema,
  PaginationMetaSchema,
  ResourcesQuerySchema,
  UploadUrlResponseSchema,
  type Resource,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type CreateResource = z.infer<typeof CreateResourceSchema>;
type DownloadUrlResponse = z.infer<typeof DownloadUrlResponseSchema>;
type ResourcesQuery = z.infer<typeof ResourcesQuerySchema>;
type UploadUrlResponse = z.infer<typeof UploadUrlResponseSchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapResource(row: typeof resources.$inferSelect): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    programId: row.programId,
    courseId: row.courseId,
    scope: row.scope,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    publicUrl: row.publicUrl,
    currentVersion: row.currentVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildResourcesWhere(query: ResourcesQuery) {
  const conditions = [isNull(resources.archivedAt)];

  if (query.scope) conditions.push(eq(resources.scope, query.scope));
  if (query.programId) conditions.push(eq(resources.programId, query.programId));
  if (query.courseId) conditions.push(eq(resources.courseId, query.courseId));
  if (query.mimeType) conditions.push(eq(resources.mimeType, query.mimeType));
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(ilike(resources.title, pattern), ilike(resources.description, pattern))!,
    );
  }

  return and(...conditions);
}

export async function listResources(
  query: ResourcesQuery,
): Promise<{ items: Resource[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildResourcesWhere(query);

  const countRows = await db.select({ total: count() }).from(resources).where(where);
  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(resources)
    .where(where)
    .orderBy(desc(resources.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapResource),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createResourceMetadata(
  uploadedById: string,
  input: CreateResource,
): Promise<UploadUrlResponse> {
  const db = getDb();
  const storageKey = `resources/${crypto.randomUUID()}/${input.filename}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [created] = await db
    .insert(resources)
    .values({
      title: input.title,
      description: input.description ?? null,
      programId: input.programId ?? null,
      courseId: input.courseId ?? null,
      scope: input.scope,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey,
      uploadedById,
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear el recurso');

  const baseUrl = process.env.STORAGE_PUBLIC_URL ?? 'https://storage.example.com';
  const uploadUrl = `${baseUrl}/upload?key=${encodeURIComponent(storageKey)}`;

  return {
    resourceId: created.id,
    uploadUrl,
    storageKey,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getDownloadUrl(resourceId: string): Promise<DownloadUrlResponse> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, resourceId), isNull(resources.archivedAt)))
    .limit(1);

  if (!row) throw new AppError('NOT_FOUND', 'Recurso no encontrado');

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const baseUrl = process.env.STORAGE_PUBLIC_URL ?? 'https://storage.example.com';
  const downloadUrl =
    row.publicUrl ?? `${baseUrl}/download?key=${encodeURIComponent(row.storageKey)}`;

  return {
    downloadUrl,
    expiresAt: expiresAt.toISOString(),
  };
}
