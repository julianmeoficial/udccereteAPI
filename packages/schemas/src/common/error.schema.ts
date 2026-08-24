import { z } from '@hono/zod-openapi';
import { ResponseMetaSchema } from './response.schema.js';

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_DEGRADED',
] as const;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES).openapi('ApiErrorCode', {
  description: 'Catálogo de códigos de error de la API',
  example: 'VALIDATION_ERROR',
});

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const API_ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_DEGRADED: 503,
} as const satisfies Record<ApiErrorCode, number>;

export const ApiErrorDetailSchema = z
  .object({
    path: z.string().openapi({
      description: 'Ruta del campo con error (notación punto)',
      example: 'email',
    }),
    message: z.string().openapi({
      description: 'Descripción del fallo de validación',
      example: 'Correo institucional requerido',
    }),
  })
  .openapi('ApiErrorDetail');

export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

export const ApiErrorBodySchema = z
  .object({
    code: ApiErrorCodeSchema,
    message: z.string().openapi({
      description: 'Mensaje legible para el cliente',
      example: 'Los datos enviados no son válidos.',
    }),
    details: z.array(ApiErrorDetailSchema).openapi({
      description: 'Detalle por campo cuando el error es de validación; vacío en el resto',
      example: [],
    }),
  })
  .openapi('ApiErrorBody');

export const ApiErrorSchema = z
  .object({
    error: ApiErrorBodySchema,
    meta: ResponseMetaSchema,
  })
  .openapi('ApiError');

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
