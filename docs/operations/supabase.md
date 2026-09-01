# Conectar Supabase

Lista de verificación para pasar de desarrollo local a Supabase gestionado. **No commitear secretos.**

**Actualizado:** 2026-08-31

El proyecto cloud `udccereteAPI` (`asuocmpkclihdrrtxmge`, región `us-west-2`) ya existe. Si partes de cero en otro entorno, crea un proyecto nuevo en el [Dashboard](https://supabase.com/dashboard).

## 1. Variables de entorno

Copiar [`.env.example`](../../.env.example) → `.env` y completar según [env.md](./env.md):

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # solo workers / operaciones sin user_id
SUPABASE_JWT_JWKS_URL=https://[ref].supabase.co/auth/v1/.well-known/jwks.json
SITE_URL=https://tu-frontend.com
```

## 2. Auth (Magic Link + Google OAuth)

### Email / Magic Link

1. Authentication → Providers → Email: habilitar Magic Link.
2. **No** restringir dominio en el panel (cualquier email puede registrarse; la API exige `@unicartagena.edu.co` solo para publicar/comentar).
3. Configurar SMTP con **Resend** (SPF/DKIM/DMARC del dominio del blog).
4. Plantilla de correo: incluir `{{ .ConfirmationURL }}` y `{{ .Token }}` (OTP).
5. Caducidad del JWT: 1 h; refresh rotatorio según [auth](../architecture/auth.md).

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID.
2. Tipo *External* (no requiere Workspace de Unicartagena). Modo *Testing* + usuarios de prueba, o publicar la app.
3. Authorized redirect URI: `https://[ref].supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → pegar Client ID y Secret.
5. Authentication → URL Configuration → Redirect URLs: `SITE_URL`, rutas de callback del frontend.

## 3. Migraciones y SQL

Seguir el orden completo en [migrations-supabase.md](./migrations-supabase.md):

1. `pnpm --filter @udccerete/db db:migrate` (Drizzle `0000` + `0001`)
2. SQL Editor: `triggers.sql` → `rls.sql`
3. `pnpm --filter @udccerete/db db:seed:catalog` (opcional)

## 4. Metadatos JWT (`app_metadata`)

Para roles de edición, configurar en Supabase o vía Admin API:

```json
{
  "role": "editor",
  "center_id": "uuid-del-centro",
  "program_id": "uuid-opcional"
}
```

**No usar `user_metadata` para autorizar** (ver [auth](../architecture/auth.md)).

## 5. Verificación

```bash
pnpm --filter @udccerete/api dev
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/doc

# Magic Link
curl -X POST http://localhost:3001/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@unicartagena.edu.co"}'

# Con JWT válido
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/me
```

## 6. Servicios cloud adicionales

| Servicio | Variable | Uso |
|----------|----------|-----|
| Cloudflare R2 | `R2_*` | Recursos y portadas |
| Typesense Cloud o VPS | `TYPESENSE_*` | Búsqueda (`GET /api/v1/search`) |
| Resend | SMTP en Supabase + `RESEND_API_KEY` en API | Magic Link + notificaciones |
| Redis (Upstash o VPS) | `REDIS_URL` | Colas BullMQ |

## Referencias

- [Variables de entorno](./env.md)
- [Migraciones a Supabase](./migrations-supabase.md)
- [Desarrollo local](./local.md)
- [Modelo de datos](../architecture/data-model.md)
- [Autenticación](../architecture/auth.md)
