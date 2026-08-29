import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { eventRegistrations, events, getDb } from '@udccerete/db';
import { PaginationMetaSchema, type Event, z } from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';
import { slugify } from '../lib/slug.js';

type CreateEvent = {
  title: string;
  slug?: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  registrationUrl?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'archived';
};
type EventRegistration = {
  id: string;
  eventId: string;
  registeredAt: string;
};
type EventsQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'archived';
};
type UpdateEvent = Partial<CreateEvent>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapEvent(row: typeof events.$inferSelect): Event {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    location: row.location,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    capacity: row.capacity,
    registrationUrl: row.registrationUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildEventsWhere(query: EventsQuery) {
  const conditions: SQL[] = [];
  if (query.status) conditions.push(eq(events.status, query.status));
  if (query.from) conditions.push(sql`${events.startsAt} >= ${new Date(query.from)}`);
  if (query.to) conditions.push(sql`${events.startsAt} <= ${new Date(query.to)}`);
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listEvents(
  query: EventsQuery,
): Promise<{ items: Event[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildEventsWhere(query);

  const countRows = await db
    .select({ total: count() })
    .from(events)
    .where(where ?? sql`true`);

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(events)
    .where(where ?? sql`true`)
    .orderBy(desc(events.startsAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapEvent),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function getEvent(eventId: string): Promise<Event> {
  const db = getDb();
  const [row] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!row) throw new AppError('NOT_FOUND', 'Evento no encontrado');
  return mapEvent(row);
}

export async function createEvent(authorId: string, input: CreateEvent): Promise<Event> {
  const db = getDb();
  const slug = input.slug ?? slugify(input.title);

  const [created] = await db
    .insert(events)
    .values({
      title: input.title,
      slug,
      description: input.description ?? null,
      location: input.location ?? null,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      capacity: input.capacity ?? null,
      registrationUrl: input.registrationUrl ?? null,
      status: input.status,
      authorId,
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear el evento');
  return mapEvent(created);
}

export async function updateEvent(eventId: string, input: UpdateEvent): Promise<Event> {
  const db = getDb();
  const [existing] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!existing) throw new AppError('NOT_FOUND', 'Evento no encontrado');

  const [updated] = await db
    .update(events)
    .set({
      title: input.title ?? existing.title,
      slug: input.slug ?? existing.slug,
      description:
        input.description !== undefined ? input.description ?? null : existing.description,
      location: input.location !== undefined ? input.location ?? null : existing.location,
      startsAt: input.startsAt ? new Date(input.startsAt) : existing.startsAt,
      endsAt:
        input.endsAt !== undefined
          ? input.endsAt
            ? new Date(input.endsAt)
            : null
          : existing.endsAt,
      capacity: input.capacity !== undefined ? input.capacity ?? null : existing.capacity,
      registrationUrl:
        input.registrationUrl !== undefined
          ? input.registrationUrl ?? null
          : existing.registrationUrl,
      status: input.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Evento no encontrado');
  return mapEvent(updated);
}

export async function register(
  eventId: string,
  profileId: string,
): Promise<EventRegistration> {
  const db = getDb();
  const event = await getEvent(eventId);

  if (event.status === 'cancelled' || event.status === 'archived') {
    throw new AppError('CONFLICT', 'El evento no acepta inscripciones');
  }

  if (event.capacity !== null) {
    const countRows = await db
      .select({ registered: count() })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    if (Number(countRows[0]?.registered ?? 0) >= event.capacity) {
      throw new AppError('CONFLICT', 'El evento ha alcanzado su capacidad');
    }
  }

  const [existing] = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.profileId, profileId)),
    )
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      eventId: existing.eventId,
      registeredAt: existing.registeredAt.toISOString(),
    };
  }

  const [created] = await db
    .insert(eventRegistrations)
    .values({ eventId, profileId })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo registrar al evento');

  return {
    id: created.id,
    eventId: created.eventId,
    registeredAt: created.registeredAt.toISOString(),
  };
}

export async function unregister(eventId: string, profileId: string): Promise<void> {
  const db = getDb();
  const [deleted] = await db
    .delete(eventRegistrations)
    .where(
      and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.profileId, profileId)),
    )
    .returning();

  if (!deleted) throw new AppError('NOT_FOUND', 'Inscripción no encontrada');
}

export async function cancelEvent(eventId: string): Promise<Event> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(events)
    .set({ status: 'cancelled', cancelledAt: now, updatedAt: now })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Evento no encontrado');
  return mapEvent(updated);
}
