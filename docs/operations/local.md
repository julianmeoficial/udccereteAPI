# Desarrollo local

## Requisitos

- Node.js 24, pnpm 9, Docker (opcional)

## Configuración

```bash
corepack enable
pnpm install
cp .env.example .env
```

Editar `.env` con valores locales. Para desarrollo sin Supabase cloud, usar Postgres del `docker-compose`.

## Infra local con Docker

```bash
docker compose up -d
```

Servicios:

| Servicio | Puerto | Uso |
|----------|--------|-----|
| Postgres 17 | 5432 | `DATABASE_URL` local |
| Redis 7 | 6379 | Caché, rate limit, BullMQ |
| Typesense | 8108 | Búsqueda (`dev-typesense-key` en compose) |

## Variables clave

Ver [.env.example](../../.env.example) completo.

| Variable | Desarrollo local |
|----------|------------------|
| `DATABASE_URL` | `postgresql://udccerete:udccerete@localhost:5432/udccerete` |
| `REDIS_URL` | `redis://localhost:6379` |
| `TYPESENSE_HOST` | `localhost` |
| `TYPESENSE_API_KEY` | `dev-typesense-key` (compose) |
| `SUPABASE_*` | Proyecto Supabase de desarrollo |

## Scripts (root)

```bash
pnpm typecheck   # TypeScript en todos los workspaces
pnpm lint        # ESLint
pnpm build       # Compila packages y apps
pnpm dev         # Turbo dev (servidor en fase posterior)
```

## Producción (referencia)

| Entorno | API / workers | DB / Auth | Archivos |
|---------|---------------|-----------|----------|
| Producción | VPS Hetzner + Docker + Caddy | Supabase | Cloudflare R2 |
| CI | GitHub Actions | Migraciones Drizzle en PR | — |

La API **no se despliega en Vercel**; requiere proceso persistente para workers.

## Portabilidad (plan B)

Todo el backend se describe en `docker-compose.yml`. Restaurar Postgres desde volcado y `docker compose up` en otro proveedor en ≤ 4 horas (RNF-POR-001).

## Referencias

- [ADR 0001](../adr/0001-stack-backend.md)
- [README](../../README.md)
