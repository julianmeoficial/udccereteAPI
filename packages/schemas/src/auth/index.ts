import { z } from '@hono/zod-openapi';
import { RoleSchema } from '../common/role.schema.js';

export const NotificationPreferencesSchema = z
  .object({
    emailCategories: z.array(z.string()).optional(),
    pushCategories: z.array(z.string()).optional(),
    weeklyDigest: z.boolean().optional(),
    urgentOnly: z.boolean().optional(),
  })
  .openapi('NotificationPreferences');

export const ProfileSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().min(1),
    role: RoleSchema,
    centerId: z.string().uuid().nullable(),
    programId: z.string().uuid().nullable(),
    semester: z.string().nullable(),
    notificationPreferences: NotificationPreferencesSchema,
    emailVerified: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('Profile');

export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    semester: z.string().optional(),
    notificationPreferences: NotificationPreferencesSchema.optional(),
  })
  .openapi('UpdateProfile');

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const JwtUserSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  centerId: z.string().uuid().nullable(),
  programId: z.string().uuid().nullable(),
});

export type JwtUser = z.infer<typeof JwtUserSchema>;
