import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Eventos analíticos anonimizados (RD-009). Sin user_id ni IP completa. */
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  path: text('path'),
  searchTerm: text('search_term'),
  referrer: text('referrer'),
  deviceType: text('device_type'),
  programSlug: text('program_slug'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const searchZeroResults = pgTable('search_zero_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  query: text('query').notNull(),
  filters: text('filters'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
