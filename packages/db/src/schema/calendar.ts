import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courses, programs, tutors } from './catalog.js';
import { profiles } from './profiles.js';
import {
  calendarActivityStatusEnum,
  calendarActivityTypeEnum,
} from './enums.js';

export const calendarActivities = pgTable('calendar_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  activityType: calendarActivityTypeEnum('activity_type').notNull().default('other'),
  status: calendarActivityStatusEnum('status').notNull().default('scheduled'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  location: text('location'),
  semester: text('semester'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'restrict' }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
