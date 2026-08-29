import { z } from '@hono/zod-openapi';

export const WellbeingRouteSchema = z
  .object({
    id: z.string().uuid(),
    area: z.string(),
    responsibleName: z.string(),
    phone: z.string().nullable(),
    whatsapp: z.string().nullable(),
    email: z.string().email().nullable(),
    schedule: z.string().nullable(),
    description: z.string().nullable(),
    sortOrder: z.string(),
  })
  .openapi('WellbeingRoute');

export const UpdateWellbeingRouteSchema = z
  .object({
    area: z.string().min(1),
    responsibleName: z.string().min(1),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    schedule: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.string().optional(),
  })
  .openapi('UpdateWellbeingRoute');

export type WellbeingRoute = z.infer<typeof WellbeingRouteSchema>;
