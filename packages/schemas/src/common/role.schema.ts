import { z } from '@hono/zod-openapi';

/**
 * Roles de la plataforma. Valores estables de API; las reglas de negocio
 * (alcance por centro, RLS) se cerrarán en fases posteriores.
 */
export const RoleSchema = z
  .enum(['super_admin', 'admin', 'editor', 'teacher', 'student', 'visitor'])
  .openapi('Role', {
    description:
      'Rol de autorización. super_admin, admin (centro), editor, teacher (docente), student, visitor.',
    example: 'student',
  });

export type Role = z.infer<typeof RoleSchema>;
