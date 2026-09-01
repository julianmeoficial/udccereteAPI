# Variables de entorno

**Estado:** vigente · **Actualizado:** 2026-08-31

Plantilla: [`.env.example`](../../.env.example). Copiar a `.env` en la raíz del monorepo. **Nunca commitear secretos.**

## Obligatorias por escenario

| Escenario | Variables mínimas |
|-----------|-------------------|
| API local sin DB | `PORT`, `NODE_ENV` |
| API + Postgres local | `DATABASE_URL` |
| Validar JWT real de Supabase | `SUPABASE_JWT_JWKS_URL` |
| Endpoints `/api/v1/auth/*` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Producción completa | Las anteriores + `CORS_ORIGIN`, `SITE_URL` |

## Supabase Auth

| Variable | Dónde obtenerla | Uso |
|----------|-----------------|-----|
| `SUPABASE_URL` | Dashboard → Settings → API → Project URL | Proxy auth (`signInWithOtp`, OAuth) |
| `SUPABASE_ANON_KEY` | Dashboard → API → `anon` o publishable key | Mismo proxy; también en clientes Next/Expo |
| `SUPABASE_JWT_JWKS_URL` | `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` | Validación JWT en middleware Hono |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → API → service_role | **Solo** workers/scripts server-side |

## Base de datos

| Variable | Local | Supabase cloud |
|----------|-------|----------------|
| `DATABASE_URL` | `postgresql://udccerete:udccerete@localhost:5432/udccerete` | Connection string del **pooler** (modo `transaction`, puerto `6543`) |

Ver [Migraciones a Supabase](./migrations-supabase.md) para el orden de aplicación.

## URLs de la aplicación

| Variable | Descripción |
|----------|-------------|
| `SITE_URL` | URL pública del frontend. Redirect por defecto en Magic Link y Google OAuth. |
| `AUTH_REDIRECT_URL` | Opcional. Si el callback de auth vive en otra ruta que `SITE_URL`. |

Registrar también en Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** valor de `SITE_URL`
- **Redirect URLs:** `SITE_URL`, `AUTH_REDIRECT_URL` (si aplica), deep links móviles

## Google OAuth

No hay variables en `.env` para Google. Configuración en dos lugares:

1. **Google Cloud Console:** OAuth 2.0 Client (tipo *Web application* o según cliente). Redirect autorizado: `https://<ref>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard:** Authentication → Providers → Google → Client ID + Client Secret

Como desarrollador externo sin Workspace de Unicartagena, usa una app OAuth **External** en modo *Testing* (usuarios de prueba) o publicada.

## Correo (Magic Link)

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` | Notificaciones de la API (no el login). |

El Magic Link lo envía **Supabase Auth**. Configurar SMTP (Resend recomendado) en Dashboard → Authentication → SMTP.

## Infraestructura opcional

| Bloque | Variables | Si faltan |
|--------|-----------|-----------|
| Redis | `REDIS_URL` | Health reporta `not_configured`; colas inactivas |
| Typesense | `TYPESENSE_*` | Búsqueda degrada a SQL |
| R2 | `R2_*` | Uploads de recursos no disponibles |
| VAPID | `VAPID_*` | Push web deshabilitado |

## Desarrollo sin Supabase

Si `SUPABASE_JWT_JWKS_URL` está vacío y `NODE_ENV !== production`, la API acepta JWT sin verificar firma. Ver [Desarrollo local](./local.md).

## Referencias

- [Desarrollo local](./local.md)
- [Migraciones a Supabase](./migrations-supabase.md)
- [Autenticación](../architecture/auth.md)
