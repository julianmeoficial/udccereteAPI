# Desarrollo local

**Estado:** vigente · **Actualizado:** 2026-08-31

## Requisitos

- Node.js **24** (`.nvmrc`; `nvm use`)
- pnpm **9** (`corepack enable`)
- Docker (Postgres, Redis, Typesense)

## Configuración

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter @udccerete/db build
DATABASE_URL=postgresql://udccerete:udccerete@localhost:5432/udccerete pnpm --filter @udccerete/db db:migrate
DATABASE_URL=postgresql://udccerete:udccerete@localhost:5432/udccerete pnpm --filter @udccerete/db db:seed
```

### Docker Compose

| Servicio | Imagen | Puerto | Credenciales / notas |
|----------|--------|--------|----------------------|
| `postgres` | `postgres:17-alpine` | `5432` | user/pass/db: `udccerete` |
| `redis` | `redis:7-alpine` | `6379` | Sin auth en local |
| `typesense` | `typesense:27.1` | `8108` | API key: `dev-typesense-key` |

Comandos útiles:

```bash
docker compose up -d          # levantar infra
docker compose ps             # estado + healthchecks
docker compose logs postgres  # logs
docker compose down           # detener (volúmenes persisten)
docker compose down -v        # borrar datos
```

Los servicios `api` y `worker` **no** están en compose; se ejecutan con pnpm (ver abajo).

## Arrancar

```bash
# Terminal 1 — API
pnpm --filter @udccerete/api dev

# Terminal 2 — Workers (opcional, requiere Redis)
pnpm --filter @udccerete/worker dev
```

| Recurso | URL |
|---------|-----|
| Salud | `GET /health`, `GET /api/v1/health` |
| Swagger | `GET /ui` |
| OpenAPI | `GET /doc` |
| RSS | `GET /feed.xml` |

## Seed de datos

| Comando | Contenido |
|---------|-----------|
| `pnpm --filter @udccerete/db db:seed` | Catálogo + posts/comentarios de prueba (local) |
| `pnpm --filter @udccerete/db db:seed:catalog` | Solo centros, categorías, tags, bienestar |

Perfiles de prueba (UUID fijos, sin `auth.users`):

| Email | Rol |
|-------|-----|
| `editor@unicartagena.edu.co` | `editor` |
| `estudiante@unicartagena.edu.co` | `student` |
| `visitante@gmail.com` | `visitor` |

## Auth en desarrollo

### Modo rápido (JWT sin firma)

Sin `SUPABASE_JWT_JWKS_URL`, la API acepta JWT sin verificar firma (solo si `NODE_ENV !== production`):

```json
{
  "sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002",
  "email": "estudiante@unicartagena.edu.co",
  "app_metadata": { "role": "student" }
}
```

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/v1/me
```

### Modo Supabase real

Completar en `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_JWKS_URL`, `SITE_URL`.

Probar proxy auth:

```bash
curl -X POST http://localhost:3001/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.com"}'
```

Ver [Autenticación](../architecture/auth.md) y [Variables de entorno](./env.md).

## Scripts

```bash
pnpm typecheck
pnpm test          # Vitest (esquemas, permisos, posts-query, postgres-errors)
pnpm build
pnpm --filter @udccerete/db db:studio
```

## Siguiente paso

- [Variables de entorno](./env.md)
- [Migraciones a Supabase](./migrations-supabase.md)
- [Conectar Supabase](./supabase.md)
