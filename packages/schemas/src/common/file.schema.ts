import { z } from '@hono/zod-openapi';

export const FileMetadataSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: 'Identificador del archivo',
      example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    }),
    filename: z.string().min(1).openapi({
      description: 'Nombre original del archivo',
      example: 'syllabus-calculo-i.pdf',
    }),
    mimeType: z.string().min(1).openapi({
      description: 'Tipo MIME',
      example: 'application/pdf',
    }),
    size: z.number().int().nonnegative().openapi({
      description: 'Tamaño en bytes',
      example: 245760,
    }),
    url: z.string().url().optional().openapi({
      description: 'URL pública o prefirmada (R2)',
      example: 'https://cdn.example.com/syllabus-calculo-i.pdf',
    }),
    createdAt: z.string().datetime({ offset: true }).openapi({
      description: 'Fecha de alta en ISO 8601',
      example: '2026-08-24T18:00:00.000Z',
    }),
  })
  .openapi('FileMetadata');

export type FileMetadata = z.infer<typeof FileMetadataSchema>;
