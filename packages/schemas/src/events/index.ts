import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const EventStatusSchema = z
  .enum(['draft', 'published', 'cancelled', 'archived'])
  .openapi('EventStatus');

export const EventSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    capacity: z.number().int().nullable(),
    registrationUrl: z.string().url().nullable(),
    status: EventStatusSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi('Event');

export const EventsQuerySchema = PaginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  status: EventStatusSchema.optional(),
}).openapi('EventsQuery');

export const CreateEventSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).optional(),
    capacity: z.number().int().positive().optional(),
    registrationUrl: z.string().url().optional(),
    status: EventStatusSchema.default('draft'),
  })
  .openapi('CreateEvent');

export const UpdateEventSchema = CreateEventSchema.partial().openapi('UpdateEvent');

export const EventRegistrationSchema = z
  .object({
    id: z.string().uuid(),
    eventId: z.string().uuid(),
    registeredAt: z.string().datetime({ offset: true }),
  })
  .openapi('EventRegistration');

export type Event = z.infer<typeof EventSchema>;
