import type { OpenAPIHonoOptions } from '@hono/zod-openapi';
import { toApiError } from '../lib/errors.js';
import type { AppBindings } from '../types.js';

/**
 * Convierte fallos de validación de rutas OpenAPI/Zod al formato ApiErrorSchema.
 */
export const validationHook: NonNullable<OpenAPIHonoOptions<AppBindings>['defaultHook']> = (
  result,
  c,
) => {
  if (result.success) {
    return;
  }

  const requestId = c.get('requestId') ?? crypto.randomUUID();
  return c.json(
    toApiError({
      code: 'VALIDATION_ERROR',
      message: 'El cuerpo de la petición no es válido',
      requestId,
      details: result.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
        message: issue.message,
      })),
    }),
    400,
  );
};
