import { z } from '@hono/zod-openapi';
import { RoleSchema } from '../common/role.schema.js';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const AdminUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    role: RoleSchema,
    centerId: z.string().uuid().nullable(),
    programId: z.string().uuid().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .openapi('AdminUser');

export const AdminUsersQuerySchema = PaginationQuerySchema.extend({
  role: RoleSchema.optional(),
  centerId: z.string().uuid().optional(),
}).openapi('AdminUsersQuery');

export const UpdateUserRoleSchema = z
  .object({
    role: RoleSchema,
    centerId: z.string().uuid().optional(),
    programId: z.string().uuid().optional(),
  })
  .openapi('UpdateUserRole');

export type AdminUser = z.infer<typeof AdminUserSchema>;
