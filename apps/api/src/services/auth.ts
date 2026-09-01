import type { Session } from '@supabase/supabase-js';
import type {
  AuthSession,
  ExchangeSessionRequest,
  GoogleAuthRequest,
  MagicLinkRequest,
  VerifyOtpRequest,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';
import { getSupabaseAnonClient, resolveAuthRedirect } from '../lib/supabase.js';

function mapSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in ?? 3600,
    tokenType: session.token_type ?? 'bearer',
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  };
}

function mapAuthError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes('invalid') || message.includes('expired')) {
    throw new AppError('UNAUTHORIZED', 'Credenciales inválidas o expiradas');
  }
  if (message.includes('rate limit')) {
    throw new AppError('RATE_LIMITED', 'Demasiados intentos. Intente más tarde.');
  }
  throw new AppError('INTERNAL_ERROR', 'No se pudo completar la autenticación');
}

export async function sendMagicLink(input: MagicLinkRequest): Promise<{ message: string }> {
  const supabase = getSupabaseAnonClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      emailRedirectTo: resolveAuthRedirect(input.redirectTo),
    },
  });

  if (error) mapAuthError(error);
  return { message: 'Si el correo es válido, recibirá un enlace de acceso en breve.' };
}

export async function startGoogleOAuth(input: GoogleAuthRequest): Promise<{ url: string }> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: resolveAuthRedirect(input.redirectTo),
      skipBrowserRedirect: true,
    },
  });

  if (error) mapAuthError(error);
  if (!data.url) {
    throw new AppError('INTERNAL_ERROR', 'No se pudo iniciar OAuth con Google');
  }

  return { url: data.url };
}

export async function verifyOtp(input: VerifyOtpRequest): Promise<AuthSession> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: input.type ?? 'email',
  });

  if (error) mapAuthError(error);
  if (!data.session) {
    throw new AppError('UNAUTHORIZED', 'No se pudo verificar el código');
  }

  return mapSession(data.session);
}

export async function exchangeSession(input: ExchangeSessionRequest): Promise<AuthSession> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(input.code);

  if (error) mapAuthError(error);
  if (!data.session) {
    throw new AppError('UNAUTHORIZED', 'No se pudo intercambiar el código de sesión');
  }

  return mapSession(data.session);
}
