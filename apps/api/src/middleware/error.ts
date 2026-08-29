import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { AppError, codeFromHttpStatus, toApiError } from '../lib/errors.js';
import {
  InstitutionalEmailError,
  PermissionError,
} from '../lib/permissions.js';
import { env } from '../env.js';
import type { AppBindings } from '../types.js';

function requestIdFrom(c: { get: (key: 'requestId') => string | undefined }): string {
  return c.get('requestId') ?? crypto.randomUUID();
}

export const notFoundHandler: NotFoundHandler<AppBindings> = (c) => {
  return c.json(
    toApiError({
      code: 'NOT_FOUND',
      message: 'El recurso solicitado no existe',
      requestId: requestIdFrom(c),
    }),
    404,
  );
};

export const errorHandler: ErrorHandler<AppBindings> = (err, c) => {
  const requestId = requestIdFrom(c);

  if (err instanceof AppError) {
    return c.json(
      toApiError({
        code: err.code,
        message: err.message,
        requestId,
        details: err.details,
      }),
      err.status,
    );
  }

  if (err instanceof PermissionError) {
    return c.json(
      toApiError({ code: 'FORBIDDEN', message: err.message, requestId }),
      403,
    );
  }

  if (err instanceof InstitutionalEmailError) {
    return c.json(
      toApiError({ code: 'FORBIDDEN', message: err.message, requestId }),
      403,
    );
  }

  if (err instanceof HTTPException) {
    const status = err.status;
    const code = codeFromHttpStatus(status);
    return c.json(toApiError({ code, message: err.message || 'Error HTTP', requestId }), status);
  }

  if (err instanceof ZodError) {
    return c.json(
      toApiError({
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
        requestId,
        details: err.issues.map((issue) => ({
          path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
          message: issue.message,
        })),
      }),
      400,
    );
  }

  if (env.NODE_ENV !== 'production') {
    console.error({ requestId, err });
  } else {
    console.error({ requestId, message: 'INTERNAL_ERROR' });
  }

  return c.json(
    toApiError({
      code: 'INTERNAL_ERROR',
      message: 'Ha ocurrido un error interno',
      requestId,
    }),
    500,
  );
};
