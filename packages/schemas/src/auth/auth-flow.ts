import { z } from '@hono/zod-openapi';

export const MagicLinkRequestSchema = z
  .object({
    email: z.string().email(),
    redirectTo: z.string().url().optional(),
  })
  .openapi('MagicLinkRequest');

export const GoogleAuthRequestSchema = z
  .object({
    redirectTo: z.string().url().optional(),
  })
  .openapi('GoogleAuthRequest');

export const VerifyOtpRequestSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(6).max(6),
    type: z.enum(['email', 'magiclink']).optional().default('email'),
  })
  .openapi('VerifyOtpRequest');

export const ExchangeSessionRequestSchema = z
  .object({
    code: z.string().min(1),
  })
  .openapi('ExchangeSessionRequest');

export const AuthUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
  })
  .openapi('AuthUser');

export const AuthSessionSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number().int(),
    tokenType: z.string(),
    user: AuthUserSchema,
  })
  .openapi('AuthSession');

export const OAuthUrlSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi('OAuthUrl');

export const MagicLinkSentSchema = z
  .object({
    message: z.string(),
  })
  .openapi('MagicLinkSent');

export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type ExchangeSessionRequest = z.infer<typeof ExchangeSessionRequestSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
