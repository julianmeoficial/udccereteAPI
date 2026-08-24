import { z } from '@hono/zod-openapi';

export const DateRangeQuerySchema = z
  .object({
    from: z
      .string()
      .datetime({ offset: true })
      .optional()
      .openapi({
        param: { name: 'from', in: 'query' },
        description: 'Inicio del rango (ISO 8601, inclusive)',
        example: '2026-01-01T00:00:00.000Z',
      }),
    to: z
      .string()
      .datetime({ offset: true })
      .optional()
      .openapi({
        param: { name: 'to', in: 'query' },
        description: 'Fin del rango (ISO 8601, inclusive)',
        example: '2026-12-31T23:59:59.000Z',
      }),
  })
  .openapi('DateRangeQuery')
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: '`from` debe ser anterior o igual a `to`',
    path: ['from'],
  });

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
