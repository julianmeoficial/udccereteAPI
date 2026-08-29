export * from './enums.js';
export * from './catalog.js';
export * from './profiles.js';
export * from './posts.js';
export * from './comments.js';
export * from './calendar.js';
export * from './events.js';
export * from './resources.js';
export * from './forum.js';
export * from './notifications.js';
export * from './wellbeing.js';
export * from './audit.js';
export * from './analytics.js';

import * as schema from './enums.js';
import * as catalog from './catalog.js';
import * as profilesSchema from './profiles.js';
import * as postsSchema from './posts.js';
import * as commentsSchema from './comments.js';
import * as calendarSchema from './calendar.js';
import * as eventsSchema from './events.js';
import * as resourcesSchema from './resources.js';
import * as forumSchema from './forum.js';
import * as notificationsSchema from './notifications.js';
import * as wellbeingSchema from './wellbeing.js';
import * as auditSchema from './audit.js';
import * as analyticsSchema from './analytics.js';

export const allTables = {
  ...catalog,
  ...profilesSchema,
  ...postsSchema,
  ...commentsSchema,
  ...calendarSchema,
  ...eventsSchema,
  ...resourcesSchema,
  ...forumSchema,
  ...notificationsSchema,
  ...wellbeingSchema,
  ...auditSchema,
  ...analyticsSchema,
};

export type Schema = typeof allTables;
