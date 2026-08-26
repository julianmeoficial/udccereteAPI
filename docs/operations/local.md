# Desarrollo local

**Estado:** vigente · **Actualizado:** 2026-08-25

## Requisitos

- Node.js **24** (`.nvmrc`; `nvm use`)
- pnpm **9** (`packageManager`: `pnpm@9.15.0`; `corepack enable`)
- Docker (recomendado: Postgres, Redis, Typesense)

## Configuración

```bash
corepack enable
pnpm install
cp .env.example .env
```

Editar `.env`. Para Postgres sin Supabase cloud, usar el servicio del Compose.

## Infra local con Docker

```bash
docker compose up -d
```

| Servicio | Puerto | Uso |
|----------|--------|-----|
| Postgres 17 | 5432 | `DATABASE_URL` local (la API **aún no** abre conexión) |
| Redis 7 | 6379 | Previsto para caché, rate limit y BullMQ |
| Typesense 27.1 | 8108 | Búsqueda (`dev-typesense-key` en Compose) |

Compose **no** incluye los contenedores `api` ni `worker`. La API se corre con pnpm.

## Arrancar la API

```bash
pnpm --filter @udccerete/api dev
```

Por defecto escucha en `http://localhost:3001` (`PORT`). Equivalente desde la raíz: `pnpm dev` (Turbo en todos los `dev`; el worker no hace trabajo útil).

| Recurso | URL |
|---------|-----|
| Health (sonda) | `GET /health` |
| Health v1 | `GET /api/v1/health` |
| Metadatos | `GET /api/v1/meta` |
| OpenAPI JSON | `GET /doc` |
| Swagger UI | `GET /ui` |

Detalle: [Referencia de la API](../api/README.md).

## Variables clave

Ver [.env.example](../../.env.example). La API **solo exige** (con defaults) `NODE_ENV`, `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`. El resto es para fases posteriores.

| Variable | Desarrollo local |
|----------|------------------|
| `PORT` | `3001` |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5173` |
| `DATABASE_URL` | `postgresql://udccerete:udccerete@localhost:5432/udccerete` |
| `REDIS_URL` | `redis://localhost:6379` |
| `TYPESENSE_HOST` / `TYPESENSE_API_KEY` | `localhost` / `dev-typesense-key` |
| `SUPABASE_*` | Proyecto Supabase de desarrollo (cuando exista auth) |

## Scripts (raíz)

```bash
pnpm typecheck   # TypeScript en los workspaces
pnpm lint        # ESLint
pnpm format:check
pnpm build       # Compila packages y apps
pnpm dev         # Turbo dev (API + worker stub)
```

Drizzle (cuando haya esquemas): `pnpm --filter @udccerete/db db:generate` / `db:migrate` / `db:studio`.

## Producción

Ver [Despliegue](deploy.md). Resumen: VPS Hetzner + Docker + Caddy; DB/Auth en Supabase; archivos en R2. La API no se despliega en Vercel.

## Referencias

- [CI](ci.md)
- [ADR 0001](../adr/0001-stack-backend.md)
- [README](../../README.md)
