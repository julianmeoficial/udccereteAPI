import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { centers, programs } from './catalog.js';
import { roleEnum } from './enums.js';

export type NotificationPreferences = {
  emailCategories?: string[];
  pushCategories?: string[];
  weeklyDigest?: boolean;
  urgentOnly?: boolean;
};

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: roleEnum('role').notNull().default('student'),
  centerId: uuid('center_id').references(() => centers.id, { onDelete: 'set null' }),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
  semester: text('semester'),
  notificationPreferences: jsonb('notification_preferences')
    .$type<NotificationPreferences>()
    .notNull()
    .default({}),
  emailVerified: boolean('email_verified').notNull().default(false),
  deletionRequestedAt: timestamp('deletion_requested_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Token firmado para suscripción iCal por usuario/programa (RI-001). */
export const calendarFeedTokens = pgTable('calendar_feed_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  label: text('label'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
