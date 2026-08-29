import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';
import { notificationChannelEnum } from './enums.js';

export const notificationSubscriptions = pgTable('notification_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  channel: notificationChannelEnum('channel').notNull(),
  endpoint: text('endpoint'),
  p256dh: text('p256dh'),
  auth: text('auth'),
  categories: jsonb('categories').$type<string[]>().notNull().default([]),
  programIds: jsonb('program_ids').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  channel: notificationChannelEnum('channel').notNull().default('in_app'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: timestamp('read_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
