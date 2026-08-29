import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { centers } from './catalog.js';

export const wellbeingRoutes = pgTable('wellbeing_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id, { onDelete: 'cascade' }),
  area: text('area').notNull(),
  responsibleName: text('responsible_name').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  schedule: text('schedule'),
  description: text('description'),
  sortOrder: text('sort_order').default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
