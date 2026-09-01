import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { posts } from './posts.js';
import { profiles } from './profiles.js';
import { moderationStatusEnum } from './enums.js';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    body: text('body').notNull(),
    moderationStatus: moderationStatusEnum('moderation_status').notNull().default('approved'),
    hiddenAt: timestamp('hidden_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('comments_post_parent_idx').on(table.postId, table.parentId)],
);

export const commentReports = pgTable('comment_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id')
    .notNull()
    .references(() => comments.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
