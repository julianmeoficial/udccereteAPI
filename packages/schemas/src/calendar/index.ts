import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const CalendarActivityStatusSchema = z
  .enum(['scheduled', 'changed', 'cancelled'])
  .openapi('CalendarActivityStatus');

export const CalendarActivityTypeSchema = z
  .enum(['class', 'exam', 'deadline', 'meeting', 'holiday', 'other'])
  .openapi('CalendarActivityType');

export const CalendarActivitySchema = z
  .object({
    id: z.string().uuid(),
    programId: z.string().uuid(),
    courseId: z.string().uuid().nullable(),
    tutorId: z.string().uuid().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    activityType: CalendarActivityTypeSchema,
    status: CalendarActivityStatusSchema,
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    location: z.string().nullable(),
    semester: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('CalendarActivity');

export const CalendarQuerySchema = PaginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  programId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  activityType: CalendarActivityTypeSchema.optional(),
  semester: z.string().optional(),
  status: CalendarActivityStatusSchema.optional(),
}).openapi('CalendarQuery');

export const CreateCalendarActivitySchema = z
  .object({
    programId: z.string().uuid(),
    courseId: z.string().uuid().optional(),
    tutorId: z.string().uuid().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    activityType: CalendarActivityTypeSchema.default('other'),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).optional(),
    location: z.string().optional(),
    semester: z.string().optional(),
  })
  .openapi('CreateCalendarActivity');

export const UpdateCalendarActivitySchema = CreateCalendarActivitySchema.partial()
  .extend({ status: CalendarActivityStatusSchema.optional() })
  .openapi('UpdateCalendarActivity');

export const CalendarImportSchema = z
  .object({
    csv: z.string().min(1).describe('Contenido CSV con columnas program,title,startsAt,...'),
  })
  .openapi('CalendarImport');

export type CalendarActivity = z.infer<typeof CalendarActivitySchema>;
