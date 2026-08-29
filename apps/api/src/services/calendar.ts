import { and, asc, count, eq, or, sql, type SQL } from 'drizzle-orm';
import { calendarActivities, getDb, programs } from '@udccerete/db';
import {
  PaginationMetaSchema,
  type CalendarActivity,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { offset, paginationMeta } from '../lib/pagination.js';

type CalendarQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  programId?: string;
  courseId?: string;
  activityType?: 'class' | 'exam' | 'deadline' | 'meeting' | 'holiday' | 'other';
  semester?: string;
  status?: 'scheduled' | 'changed' | 'cancelled';
};
type CreateCalendarActivity = {
  programId: string;
  courseId?: string;
  tutorId?: string;
  title: string;
  description?: string;
  activityType?: 'class' | 'exam' | 'deadline' | 'meeting' | 'holiday' | 'other';
  startsAt: string;
  endsAt?: string;
  location?: string;
  semester?: string;
};
type UpdateCalendarActivity = Partial<CreateCalendarActivity> & {
  status?: 'scheduled' | 'changed' | 'cancelled';
};
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

function mapActivity(row: typeof calendarActivities.$inferSelect): CalendarActivity {
  return {
    id: row.id,
    programId: row.programId,
    courseId: row.courseId,
    tutorId: row.tutorId,
    title: row.title,
    description: row.description,
    activityType: row.activityType,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    location: row.location,
    semester: row.semester,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildCalendarWhere(query: CalendarQuery) {
  const conditions: SQL[] = [];

  if (query.programId) conditions.push(eq(calendarActivities.programId, query.programId));
  if (query.courseId) conditions.push(eq(calendarActivities.courseId, query.courseId));
  if (query.activityType) conditions.push(eq(calendarActivities.activityType, query.activityType));
  if (query.semester) conditions.push(eq(calendarActivities.semester, query.semester));
  if (query.status) conditions.push(eq(calendarActivities.status, query.status));
  if (query.from) conditions.push(sql`${calendarActivities.startsAt} >= ${new Date(query.from)}`);
  if (query.to) conditions.push(sql`${calendarActivities.startsAt} <= ${new Date(query.to)}`);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listActivities(
  query: CalendarQuery,
): Promise<{ items: CalendarActivity[]; pagination: PaginationMeta }> {
  const db = getDb();
  const where = buildCalendarWhere(query);

  const countRows = await db
    .select({ total: count() })
    .from(calendarActivities)
    .where(where ?? sql`true`);

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await db
    .select()
    .from(calendarActivities)
    .where(where ?? sql`true`)
    .orderBy(asc(calendarActivities.startsAt))
    .limit(query.pageSize)
    .offset(offset(query.page, query.pageSize));

  return {
    items: rows.map(mapActivity),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createActivity(
  createdById: string,
  input: CreateCalendarActivity,
): Promise<CalendarActivity> {
  const db = getDb();
  const [created] = await db
    .insert(calendarActivities)
    .values({
      programId: input.programId,
      courseId: input.courseId ?? null,
      tutorId: input.tutorId ?? null,
      title: input.title,
      description: input.description ?? null,
      activityType: input.activityType,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      location: input.location ?? null,
      semester: input.semester ?? null,
      createdById,
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear la actividad');
  return mapActivity(created);
}

export async function updateActivity(
  activityId: string,
  input: UpdateCalendarActivity,
): Promise<CalendarActivity> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(calendarActivities)
    .where(eq(calendarActivities.id, activityId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Actividad no encontrada');

  const [updated] = await db
    .update(calendarActivities)
    .set({
      programId: input.programId ?? existing.programId,
      courseId: input.courseId !== undefined ? input.courseId ?? null : existing.courseId,
      tutorId: input.tutorId !== undefined ? input.tutorId ?? null : existing.tutorId,
      title: input.title ?? existing.title,
      description:
        input.description !== undefined ? input.description ?? null : existing.description,
      activityType: input.activityType ?? existing.activityType,
      status: input.status ?? existing.status,
      startsAt: input.startsAt ? new Date(input.startsAt) : existing.startsAt,
      endsAt:
        input.endsAt !== undefined
          ? input.endsAt
            ? new Date(input.endsAt)
            : null
          : existing.endsAt,
      location: input.location !== undefined ? input.location ?? null : existing.location,
      semester: input.semester !== undefined ? input.semester ?? null : existing.semester,
      updatedAt: new Date(),
    })
    .where(eq(calendarActivities.id, activityId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Actividad no encontrada');
  return mapActivity(updated);
}

export async function cancelActivity(activityId: string): Promise<CalendarActivity> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(calendarActivities)
    .set({ status: 'cancelled', cancelledAt: now, updatedAt: now })
    .where(eq(calendarActivities.id, activityId))
    .returning();

  if (!updated) throw new AppError('NOT_FOUND', 'Actividad no encontrada');
  return mapActivity(updated);
}

function formatIcsDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateIcs(activities: CalendarActivity[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UDEC Cereté//Calendar//ES',
    'CALSCALE:GREGORIAN',
  ];

  for (const activity of activities) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${activity.id}@udccerete`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${formatIcsDate(activity.startsAt)}`);
    if (activity.endsAt) lines.push(`DTEND:${formatIcsDate(activity.endsAt)}`);
    lines.push(`SUMMARY:${activity.title.replace(/[,;\\]/g, '\\$&')}`);
    if (activity.description) {
      lines.push(`DESCRIPTION:${activity.description.replace(/[\n\r]/g, '\\n').replace(/[,;\\]/g, '\\$&')}`);
    }
    if (activity.location) lines.push(`LOCATION:${activity.location.replace(/[,;\\]/g, '\\$&')}`);
    if (activity.status === 'cancelled') lines.push('STATUS:CANCELLED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

async function resolveProgramId(programRef: string): Promise<string | null> {
  const db = getDb();
  const [bySlug] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(or(eq(programs.slug, programRef), eq(programs.id, programRef)))
    .limit(1);
  return bySlug?.id ?? null;
}

export async function importCsv(
  csv: string,
  createdById: string,
): Promise<{ imported: number; errors: string[] }> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new AppError('VALIDATION_ERROR', 'CSV vacío o sin filas de datos');
  }

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const programIdx = headers.indexOf('program');
  const titleIdx = headers.indexOf('title');
  const startsAtIdx = headers.indexOf('startsat');

  if (programIdx === -1 || titleIdx === -1 || startsAtIdx === -1) {
    throw new AppError(
      'VALIDATION_ERROR',
      'CSV debe incluir columnas program, title y startsAt',
    );
  }

  const descriptionIdx = headers.indexOf('description');
  const endsAtIdx = headers.indexOf('endsat');
  const locationIdx = headers.indexOf('location');
  const semesterIdx = headers.indexOf('semester');
  const activityTypeIdx = headers.indexOf('activitytype');

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(',').map((c) => c.trim());
    if (cols.every((c) => !c)) continue;

    const programRef = cols[programIdx];
    const title = cols[titleIdx];
    const startsAtRaw = cols[startsAtIdx];

    if (!programRef || !title || !startsAtRaw) {
      errors.push(`Fila ${i + 1}: program, title y startsAt son obligatorios`);
      continue;
    }

    const programId = await resolveProgramId(programRef);
    if (!programId) {
      errors.push(`Fila ${i + 1}: programa "${programRef}" no encontrado`);
      continue;
    }

    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) {
      errors.push(`Fila ${i + 1}: startsAt inválido`);
      continue;
    }

    const endsAtRaw = endsAtIdx >= 0 ? cols[endsAtIdx] : undefined;
    const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;

    try {
      await createActivity(createdById, {
        programId,
        title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt.toISOString() : undefined,
        description: descriptionIdx >= 0 ? cols[descriptionIdx] : undefined,
        location: locationIdx >= 0 ? cols[locationIdx] : undefined,
        semester: semesterIdx >= 0 ? cols[semesterIdx] : undefined,
        activityType:
          activityTypeIdx >= 0 && cols[activityTypeIdx]
            ? (cols[activityTypeIdx] as CreateCalendarActivity['activityType'])
            : 'other',
      });
      imported++;
    } catch (err) {
      errors.push(`Fila ${i + 1}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }

  return { imported, errors };
}
