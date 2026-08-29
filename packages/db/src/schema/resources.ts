import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courses, programs } from './catalog.js';
import { profiles } from './profiles.js';
import { resourceScopeEnum } from './enums.js';

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  scope: resourceScopeEnum('scope').notNull().default('institutional'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageKey: text('storage_key').notNull(),
  publicUrl: text('public_url'),
  uploadedById: uuid('uploaded_by_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'restrict' }),
  currentVersion: integer('current_version').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const resourceVersions = pgTable('resource_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resources.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedById: uuid('uploaded_by_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
