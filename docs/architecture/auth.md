# Autenticación y autorización

**Estado:** implementado (JWT + proxy auth + permisos) · **Actualizado:** 2026-08-31

La API valida JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`. Sin JWKS en desarrollo, acepta tokens de prueba (ver [Desarrollo local](../operations/local.md)).

## Métodos de login y registro

| Método | Quién puede usarlo | Rol inicial |
|--------|-------------------|-------------|
| **Magic Link** | Cualquier email | `@unicartagena.edu.co` → `student`; otros → `visitor` |
| **Google OAuth** | Cualquier cuenta Google | Igual que arriba (trigger `handle_new_user`) |

Publicar posts y comentar **requieren** correo `@unicartagena.edu.co` (`requireInstitutionalEmail`), independientemente del método de login.

## Flujo A — Magic Link + OTP

1. Cliente llama `POST /api/v1/auth/magic-link` con `{ "email": "..." }` **o** usa `supabase.auth.signInWithOtp` directamente.
2. Supabase Auth envía correo con enlace y OTP de 6 dígitos (SMTP vía Resend en producción).
3. El usuario abre el enlace (redirect a `SITE_URL`) **o** verifica con `POST /api/v1/auth/verify` `{ email, token }`.
4. Supabase emite JWT (1 h) y refresh token rotatorio.
5. El cliente envía `Authorization: Bearer <JWT>` a la API.
6. Hono valida firma con JWKS; PostgreSQL aplica RLS cuando está activo.

## Flujo B — Google OAuth

1. Cliente llama `POST /api/v1/auth/google` → recibe `{ url }` **o** usa `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2. El navegador redirige a Google; callback en `{SUPABASE_URL}/auth/v1/callback`.
3. Tras consentimiento, el cliente intercambia el código con `POST /api/v1/auth/session` `{ code }` (PKCE).
4. Mismos pasos 4–6 del flujo A.

## Endpoints proxy en la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/magic-link` | Envía Magic Link (202) |
| `POST` | `/api/v1/auth/google` | URL de autorización Google |
| `POST` | `/api/v1/auth/verify` | Verificar OTP de 6 dígitos |
| `POST` | `/api/v1/auth/session` | Intercambiar código PKCE por sesión |

Requieren `SUPABASE_URL` + `SUPABASE_ANON_KEY`. Los clientes Next/Expo **también pueden** llamar a Supabase directamente con `@supabase/supabase-js`.

## Salvaguardas (Supabase Auth)

- Enlace válido **15 minutos**, un solo uso.
- OTP de 6 dígitos como alternativa.
- Límite de **3 solicitudes por correo cada 15 minutos** (rate limit de GoTrue).
- Sesión recordada **30 días** en dispositivos confiables.

## Roles

Valores de contrato (`RoleSchema` en `@udccerete/schemas`):

| Rol API | Alcance previsto |
|---------|------------------|
| `super_admin` | Sistema completo |
| `admin` | Su centro tutorial |
| `editor` | Contenido asignado (editor / blogger) |
| `teacher` | Recursos y perfil (docente) |
| `student` | Lectura y participación limitada |
| `visitor` | Lectura pública |

La autorización efectiva vive en **RLS** (PostgreSQL), con una segunda capa en la API. No usar `user_metadata` del JWT para autorizar; usar `app_metadata`.

Staff (`editor`, `admin`, etc.) se asigna manualmente en `app_metadata.role` vía Dashboard o Admin API.

## Implementación en la API

- Proxy auth: `apps/api/src/services/auth.ts` + `@supabase/supabase-js` (anon key).
- Validación JWT: `apps/api/src/middleware/auth.ts` con `jose`.
- Matriz de permisos: `apps/api/src/lib/permissions.ts`.
- Trigger profiles: `packages/db/supabase/triggers.sql`.
- Service role key solo en workers; nunca en clientes.

## Referencias

- [Variables de entorno](../operations/env.md)
- [Migraciones a Supabase](../operations/migrations-supabase.md)
- [Referencia de la API](../api/README.md)
- [ADR 0001](../adr/0001-stack-backend.md)
