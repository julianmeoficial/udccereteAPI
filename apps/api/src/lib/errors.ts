import type { ApiError, ApiErrorCode, ApiErrorDetail } from '@udccerete/schemas';
import { API_ERROR_STATUS } from '@udccerete/schemas';

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly details: ApiErrorDetail[];

  constructor(code: ApiErrorCode, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  get status() {
    return API_ERROR_STATUS[this.code];
  }
}

export function httpStatusForCode(code: ApiErrorCode): (typeof API_ERROR_STATUS)[ApiErrorCode] {
  return API_ERROR_STATUS[code];
}

export function codeFromHttpStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'SERVICE_DEGRADED';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
  }
}

export function toApiError(input: {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: ApiErrorDetail[];
}): ApiError {
  return {
    error: {
      code: input.code,
      message: input.message,
      details: input.details ?? [],
    },
    meta: {
      requestId: input.requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
