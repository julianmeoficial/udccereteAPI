# Conectar Supabase

Checklist para pasar de desarrollo local a Supabase gestionado. **No commitear secretos.**

**Actualizado:** 2026-08-28

## 1. Crear proyecto

1. [Supabase Dashboard](https://supabase.com/dashboard) → nuevo proyecto (PostgreSQL 17).
2. Anotar **Project URL**, **anon key**, **service role key** y **Database URL** (pooler, modo `transaction`).

## 2. Auth (Magic Link + OTP)

1. Authentication → Providers → Email: habilitar Magic Link.
2. Restringir dominio `@unicartagena.edu.co` si aplica.
3. Configurar SMTP con **Resend** (SPF/DKIM/DMARC del dominio del blog).
4. JWT expiry: 1 h; refresh rotatorio según [auth](../architecture/auth.md).

## 3. Variables de entorno

Copiar [`.env.example`](../../.env.example) → `.env`:

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # solo workers / operaciones sin user_id
SUPABASE_JWT_JWKS_URL=https://[ref].supabase.co/auth/v1/.well-known/jwks.json
```

Opcionales (degradación elegante si faltan): `REDIS_URL`, Typesense, R2, `RESEND_API_KEY`, VAPID.

## 4. Migraciones Drizzle

```bash
docker compose up -d postgres   # solo si pruebas local primero
pnpm --filter @udccerete/db build
pnpm --filter @udccerete/db db:generate   # ya generado en repo
DATABASE_URL="..." pnpm --filter @udccerete/db db:migrate
```

Migración inicial: [`packages/db/drizzle/0000_*.sql`](../../packages/db/drizzle/).

## 5. SQL de Supabase (RLS + triggers)

En el SQL Editor de Supabase, en orden:

1. [`packages/db/supabase/triggers.sql`](../../packages/db/supabase/triggers.sql) — crea `profiles` al registrar usuario en `auth.users`.
2. [`packages/db/supabase/rls.sql`](../../packages/db/supabase/rls.sql) — políticas por rol.

Verificar que `auth.uid()` y `auth.jwt()` estén disponibles (extensión incluida en Supabase).

## 6. Metadatos JWT (`app_metadata`)

Para roles de edición, configurar en Supabase o vía Admin API:

```json
{
  "role": "editor",
  "center_id": "uuid-del-centro",
  "program_id": "uuid-opcional"
}
```

**No usar `user_metadata` para autorizar** (ver [auth](../architecture/auth.md)).

## 7. Seed inicial (opcional)

Insertar `centers`, `programs`, `wellbeing_routes` y un `super_admin` vía SQL o script. El primer SuperAdmin puede asignarse manualmente en `profiles.role` tras el primer login.

## 8. Verificación

```bash
pnpm --filter @udccerete/api dev
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/doc
```

Con JWT válido de Supabase:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/me
```

## 9. Servicios cloud adicionales

| Servicio | Variable | Uso |
|----------|----------|-----|
| Cloudflare R2 | `R2_*` | Recursos y portadas |
| Typesense Cloud o VPS | `TYPESENSE_*` | Búsqueda (`GET /api/v1/search`) |
| Resend | `RESEND_API_KEY` | Notificaciones y Magic Link SMTP |
| Redis (Upstash o VPS) | `REDIS_URL` | Colas BullMQ |

## Referencias

- [Desarrollo local](./local.md)
- [Modelo de datos](../architecture/data-model.md)
- [Autenticación](../architecture/auth.md)
