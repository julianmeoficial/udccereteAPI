import { getDb, auditLog } from '@udccerete/db';

export async function writeAudit(input: {
  actorId: string | null;
  action: (typeof auditLog.$inferInsert)['action'];
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(auditLog).values({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    payload: input.payload ?? null,
  });
}
