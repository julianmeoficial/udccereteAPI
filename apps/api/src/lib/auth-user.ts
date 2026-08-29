import type { JwtUser, Role } from '@udccerete/schemas';
import { RoleSchema } from '@udccerete/schemas';

export type AuthUser = JwtUser;

export function parseJwtPayload(payload: Record<string, unknown>): AuthUser | null {
  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  const email =
    typeof payload.email === 'string'
      ? payload.email
      : typeof (payload as { user_metadata?: { email?: string } }).user_metadata?.email ===
          'string'
        ? (payload as { user_metadata: { email: string } }).user_metadata.email
        : null;

  if (!sub || !email) return null;

  const appMeta =
    (payload.app_metadata as Record<string, unknown> | undefined) ??
    (payload as { app_metadata?: Record<string, unknown> }).app_metadata ??
    {};

  const roleRaw = appMeta.role;
  const roleParsed = RoleSchema.safeParse(roleRaw);
  const role: Role = roleParsed.success ? roleParsed.data : 'student';

  const centerId =
    typeof appMeta.center_id === 'string'
      ? appMeta.center_id
      : typeof appMeta.centerId === 'string'
        ? appMeta.centerId
        : null;

  const programId =
    typeof appMeta.program_id === 'string'
      ? appMeta.program_id
      : typeof appMeta.programId === 'string'
        ? appMeta.programId
        : null;

  return { sub, email, role, centerId, programId };
}
