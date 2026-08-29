import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const NotificationChannelSchema = z
  .enum(['email', 'web_push', 'in_app'])
  .openapi('NotificationChannel');

export const NotificationSchema = z
  .object({
    id: z.string().uuid(),
    channel: NotificationChannelSchema,
    title: z.string(),
    body: z.string(),
    link: z.string().url().nullable(),
    readAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .openapi('Notification');

export const NotificationsQuerySchema = PaginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
}).openapi('NotificationsQuery');

export const PushSubscriptionSchema = z
  .object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    categories: z.array(z.string()).optional(),
    programIds: z.array(z.string().uuid()).optional(),
  })
  .openapi('PushSubscription');

export const UpdateNotificationPreferencesSchema = z
  .object({
    emailCategories: z.array(z.string()).optional(),
    pushCategories: z.array(z.string()).optional(),
    weeklyDigest: z.boolean().optional(),
    urgentOnly: z.boolean().optional(),
  })
  .openapi('UpdateNotificationPreferences');

export type Notification = z.infer<typeof NotificationSchema>;
