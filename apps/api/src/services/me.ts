import { eq } from 'drizzle-orm';
import { getDb, profiles, type NotificationPreferences } from '@udccerete/db';
import type { Profile, UpdateProfile } from '@udccerete/schemas';
import type { AuthUser } from '../lib/auth-user.js';

function mapProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    centerId: row.centerId,
    programId: row.programId,
    semester: row.semester,
    notificationPreferences: row.notificationPreferences ?? {},
    emailVerified: row.emailVerified,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getOrCreateProfile(user: AuthUser): Promise<Profile> {
  const db = getDb();
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.sub)).limit(1);
  if (existing) return mapProfile(existing);

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.sub,
      email: user.email,
      fullName: user.email.split('@')[0] ?? 'Usuario',
      role: user.role,
      centerId: user.centerId,
      programId: user.programId,
      notificationPreferences: {},
      emailVerified: false,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return mapProfile(created);

  const [fallback] = await db.select().from(profiles).where(eq(profiles.id, user.sub)).limit(1);
  if (!fallback) throw new Error('No se pudo crear el perfil');
  return mapProfile(fallback);
}

export async function updateProfile(user: AuthUser, input: UpdateProfile): Promise<Profile> {
  const db = getDb();
  await getOrCreateProfile(user);
  const [updated] = await db
    .update(profiles)
    .set({
      fullName: input.fullName,
      semester: input.semester,
      notificationPreferences: input.notificationPreferences as NotificationPreferences | undefined,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.sub))
    .returning();
  if (!updated) throw new Error('Perfil no encontrado');
  return mapProfile(updated);
}

export async function requestAccountDeletion(user: AuthUser): Promise<{ scheduledAt: string }> {
  const db = getDb();
  const now = new Date();
  await db
    .update(profiles)
    .set({ deletionRequestedAt: now, updatedAt: now })
    .where(eq(profiles.id, user.sub));
  const scheduled = new Date(now);
  scheduled.setDate(scheduled.getDate() + 15);
  return { scheduledAt: scheduled.toISOString() };
}
