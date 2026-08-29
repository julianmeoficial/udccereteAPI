import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courses, tutors } from './catalog.js';
import { forumTargetTypeEnum, moderationStatusEnum } from './enums.js';

/** Opiniones anónimas: sin user_id (RN-003). */
export const forumOpinions = pgTable('forum_opinions', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: forumTargetTypeEnum('target_type').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  body: text('body').notNull(),
  moderationStatus: moderationStatusEnum('moderation_status').notNull().default('pending'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const forumReports = pgTable('forum_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  opinionId: uuid('opinion_id')
    .notNull()
    .references(() => forumOpinions.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
