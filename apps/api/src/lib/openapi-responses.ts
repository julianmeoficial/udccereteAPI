import { ApiErrorSchema } from '@udccerete/schemas';

export const apiErrorJson = {
  'application/json': {
    schema: ApiErrorSchema,
  },
} as const;
