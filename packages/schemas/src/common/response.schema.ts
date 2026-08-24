import { z } from '@hono/zod-openapi';

export const HealthResponseSchema = z
  .object({
    status: z.literal('ok').openapi({
      description: 'Indicador de disponibilidad',
      example: 'ok',
    }),
  })
  .openapi('HealthResponse');

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const MetaResponseSchema = z
  .object({
    name: z.string().openapi({
      description: 'Nombre del servicio',
      example: 'API Blog UDEC Cereté',
    }),
    version: z.string().openapi({
      description: 'Versión del paquete de la API (package.json)',
      example: '0.0.0',
    }),
    environment: z.string().openapi({
      description: 'Entorno de ejecución (NODE_ENV)',
      example: 'development',
    }),
    status: z.literal('ok').openapi({
      description: 'Estado operativo',
      example: 'ok',
    }),
  })
  .openapi('MetaResponse');

export type MetaResponse = z.infer<typeof MetaResponseSchema>;

export const SuccessMessageSchema = z
  .object({
    message: z.string().openapi({
      description: 'Mensaje de confirmación',
      example: 'Operación completada',
    }),
  })
  .openapi('SuccessMessage');

export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;

/**
 * Envoltorio estándar `{ data }` para respuestas exitosas con payload.
 */
export function SuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
  name = 'SuccessResponse',
) {
  return z
    .object({
      data: dataSchema,
    })
    .openapi(name);
}

export type SuccessResponse<T> = {
  data: T;
};
