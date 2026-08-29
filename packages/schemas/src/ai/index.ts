import { z } from '@hono/zod-openapi';

export const AiAskSchema = z
  .object({
    question: z.string().min(3).max(500),
  })
  .openapi('AiAsk');

export const AiAnswerSchema = z
  .object({
    answer: z.string(),
    sources: z.array(
      z.object({
        title: z.string(),
        url: z.string().url(),
      }),
    ),
    disclaimer: z.string(),
  })
  .openapi('AiAnswer');

export type AiAsk = z.infer<typeof AiAskSchema>;
