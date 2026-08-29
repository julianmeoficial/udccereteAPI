import { asc, eq } from 'drizzle-orm';
import { getDb, wellbeingRoutes } from '@udccerete/db';
import {
  UpdateWellbeingRouteSchema,
  type WellbeingRoute,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';

type UpdateWellbeingRoute = z.infer<typeof UpdateWellbeingRouteSchema>;

function mapRoute(row: typeof wellbeingRoutes.$inferSelect): WellbeingRoute {
  return {
    id: row.id,
    area: row.area,
    responsibleName: row.responsibleName,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    schedule: row.schedule,
    description: row.description,
    sortOrder: row.sortOrder ?? '0',
  };
}

export async function listRoutes(centerId?: string): Promise<WellbeingRoute[]> {
  const db = getDb();
  const rows = centerId
    ? await db
        .select()
        .from(wellbeingRoutes)
        .where(eq(wellbeingRoutes.centerId, centerId))
        .orderBy(asc(wellbeingRoutes.sortOrder), asc(wellbeingRoutes.area))
    : await db
        .select()
        .from(wellbeingRoutes)
        .orderBy(asc(wellbeingRoutes.sortOrder), asc(wellbeingRoutes.area));

  return rows.map(mapRoute);
}

export async function upsertRoute(
  routeId: string,
  centerId: string,
  input: UpdateWellbeingRoute,
): Promise<WellbeingRoute> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(wellbeingRoutes)
    .where(eq(wellbeingRoutes.id, routeId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(wellbeingRoutes)
      .set({
        centerId,
        area: input.area,
        responsibleName: input.responsibleName,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        email: input.email ?? null,
        schedule: input.schedule ?? null,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(wellbeingRoutes.id, routeId))
      .returning();

    if (!updated) throw new AppError('NOT_FOUND', 'Ruta de bienestar no encontrada');
    return mapRoute(updated);
  }

  const [created] = await db
    .insert(wellbeingRoutes)
    .values({
      id: routeId,
      centerId,
      area: input.area,
      responsibleName: input.responsibleName,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      schedule: input.schedule ?? null,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? '0',
    })
    .returning();

  if (!created) throw new AppError('INTERNAL_ERROR', 'No se pudo crear la ruta de bienestar');
  return mapRoute(created);
}
