import { z } from '@hono/zod-openapi';

export const CitationStyleSchema = z.enum(['apa7', 'vancouver']).openapi('CitationStyle');

export const CreateCitationSchema = z
  .object({
    doi: z.string().optional(),
    url: z.string().url().optional(),
    style: CitationStyleSchema,
  })
  .refine((v) => v.doi || v.url, { message: 'Se requiere doi o url' })
  .openapi('CreateCitation');

export const CitationResultSchema = z
  .object({
    style: CitationStyleSchema,
    formatted: z.string(),
    metadata: z.record(z.unknown()).optional(),
    source: z.enum(['crossref', 'openalex', 'openlibrary', 'manual']),
  })
  .openapi('CitationResult');

export type CitationResult = z.infer<typeof CitationResultSchema>;
