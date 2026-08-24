import { requestId } from 'hono/request-id';

export const requestIdMiddleware = requestId({
  headerName: 'x-request-id',
  generator: () => crypto.randomUUID(),
});
