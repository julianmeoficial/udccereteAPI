import type { Context } from 'hono';
import type { PaginationMeta, ResponseMeta, SuccessResponse } from '@udccerete/schemas';
import type { AppBindings } from '../types.js';

export function envelopeMeta(c: Context<AppBindings>): ResponseMeta {
  return {
    requestId: c.get('requestId') ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function ok<T>(c: Context<AppBindings>, data: T) {
  return c.json({ data, meta: envelopeMeta(c) } satisfies SuccessResponse<T>, 200);
}

export function created<T>(c: Context<AppBindings>, data: T) {
  return c.json({ data, meta: envelopeMeta(c) } satisfies SuccessResponse<T>, 201);
}

export function okPaginated<T>(
  c: Context<AppBindings>,
  data: T[],
  pagination: PaginationMeta,
  status: 200 = 200,
) {
  return c.json(
    {
      data,
      meta: {
        ...envelopeMeta(c),
        pagination,
      },
    },
    status,
  );
}
