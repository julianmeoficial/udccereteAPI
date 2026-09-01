import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseAuthClientConfigured } from '../env.js';
import { AppError } from './errors.js';

let anonClient: SupabaseClient | null = null;

export function getSupabaseAnonClient(): SupabaseClient {
  if (!isSupabaseAuthClientConfigured()) {
    throw new AppError('SERVICE_DEGRADED', 'Autenticación no configurada');
  }

  if (!anonClient) {
    anonClient = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return anonClient;
}

export function resolveAuthRedirect(redirectTo?: string): string {
  return redirectTo ?? env.AUTH_REDIRECT_URL ?? env.SITE_URL;
}
