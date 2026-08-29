import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { getDb, notificationSubscriptions, notifications } from '@udccerete/db';
import {
  NotificationsQuerySchema,
  PaginationMetaSchema,
  PushSubscriptionSchema,
  type Notification,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type NotificationsQuery = z.infer<typeof NotificationsQuerySchema>;
type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  profileId: string,
  query: NotificationsQuery,
): Promise<{ items: Notification[]; pagination: PaginationMeta }> {
  const db = getDb();
  const conditions = [eq(notifications.profileId, profileId)];
  if (query.unreadOnly) conditions.push(isNull(notifications.readAt));
  const where = and(...conditions);

  const countRows = await db.select({ total: count() }).from(notifications).where(where);
  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapNotification),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function markRead(notificationId: string, profileId: string): Promise<Notification> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId)))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Notificación no encontrada');
  return mapNotification(updated);
}

export async function createPushSubscription(
  profileId: string,
  input: PushSubscription,
): Promise<{ id: string }> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(notificationSubscriptions)
    .where(
      and(
        eq(notificationSubscriptions.profileId, profileId),
        eq(notificationSubscriptions.endpoint, input.endpoint),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(notificationSubscriptions)
      .set({
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        categories: input.categories ?? [],
        programIds: input.programIds ?? [],
        active: true,
        updatedAt: new Date(),
      })
      .where(eq(notificationSubscriptions.id, existing.id))
      .returning();

    if (!updated) throw new AppError('INTERNAL_ERROR', 'No se pudo actualizar la suscripción');
    return { id: updated.id };
  }

  const [created] = await db
    .insert(notificationSubscriptions)
    .values({
      profileId,
      channel: 'web_push',
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      categories: input.categories ?? [],
      programIds: input.programIds ?? [],
      active: true,
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear la suscripción');
  return { id: created.id };
}
