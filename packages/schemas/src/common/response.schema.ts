import { z } from '@hono/zod-openapi';

export const ResponseMetaSchema = z
  .object({
    requestId: z.string().openapi({
      description: 'Identificador de trazabilidad (header x-request-id)',
      example: 'req_123',
    }),
    timestamp: z.string().datetime({ offset: true }).openapi({
      description: 'Momento de la respuesta en ISO 8601',
      example: '2026-08-24T22:45:00.000Z',
    }),
  })
  .openapi('ResponseMeta');

export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

/**
 * Envoltorio transversal de éxito: `{ data, meta }`.
 */
export function SuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
  name = 'SuccessResponse',
) {
  return z
    .object({
      data: dataSchema,
      meta: ResponseMetaSchema,
    })
    .openapi(name);
}

export type SuccessResponse<T> = {
  data: T;
  meta: ResponseMeta;
};

export const HealthDataSchema = z
  .object({
    status: z.literal('ok').openapi({
      description: 'Indicador de disponibilidad',
      example: 'ok',
    }),
  })
  .openapi('HealthData');

export type HealthData = z.infer<typeof HealthDataSchema>;

export const HealthResponseSchema = SuccessResponseSchema(HealthDataSchema, 'HealthResponse');

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const MetaDataSchema = z
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
  .openapi('MetaData');

export type MetaData = z.infer<typeof MetaDataSchema>;

export const MetaResponseSchema = SuccessResponseSchema(MetaDataSchema, 'MetaResponse');

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
