import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'super_admin',
  'admin',
  'editor',
  'teacher',
  'student',
  'visitor',
]);

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'scheduled',
  'published',
  'archived',
]);

export const moderationStatusEnum = pgEnum('moderation_status', [
  'pending',
  'approved',
  'hidden',
  'rejected',
]);

export const calendarActivityStatusEnum = pgEnum('calendar_activity_status', [
  'scheduled',
  'changed',
  'cancelled',
]);

export const calendarActivityTypeEnum = pgEnum('calendar_activity_type', [
  'class',
  'exam',
  'deadline',
  'meeting',
  'holiday',
  'other',
]);

export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'archived']);

export const resourceScopeEnum = pgEnum('resource_scope', ['institutional', 'program', 'internal']);

export const forumTargetTypeEnum = pgEnum('forum_target_type', ['course', 'tutor']);

export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'web_push', 'in_app']);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'archive',
  'moderate',
  'publish',
  'cancel',
]);
