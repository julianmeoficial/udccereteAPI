import { z } from '@hono/zod-openapi';

export const IdParamSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        param: { name: 'id', in: 'path' },
        description: 'Identificador UUID del recurso',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
  })
  .openapi('IdParam');

export type IdParam = z.infer<typeof IdParamSchema>;

export const SlugParamSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Debe ser un slug en minúsculas separado por guiones')
      .openapi({
        param: { name: 'slug', in: 'path' },
        description: 'Slug público del recurso (minúsculas, guiones)',
        example: 'bienvenida-centro-tutorial-cerete',
      }),
  })
  .openapi('SlugParam');

export type SlugParam = z.infer<typeof SlugParamSchema>;
