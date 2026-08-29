# API UDEC Cereté

Backend **API-first** del Blog UDEC Cereté (Centro Tutorial Cereté, Universidad de Cartagena). Fuente única de verdad para la web pública (Next.js), Expo iOS/Android y la app nativa HUAWEI.

La API Hono responde en local con el dominio v1 completo, OpenAPI en `/doc` y migraciones Drizzle listas. El siguiente paso es [crear el proyecto en Supabase](docs/operations/supabase.md) y conectar las credenciales.

Documentación del repo: **[docs/README.md](docs/README.md)** (incluye [diagramas de flujo](docs/architecture/diagrams.md)). Spec de producto: [API UDEC Cereté en Notion](https://app.notion.com/p/3c68b2d8659c809fa107d5347729b850).

## Stack (ADR 0001 — agosto 2026)

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 24 LTS + TypeScript 5 |
| Monorepo | Turborepo + pnpm workspaces |
| API | Hono 4 — REST `/api/v1`, OpenAPI; tRPC y webhooks previstos |
| Contratos | Zod + OpenAPI (`@udccerete/schemas`) |
| Base de datos | Supabase PostgreSQL 17 + Drizzle ORM + RLS |
| Caché / colas | Redis + BullMQ |
| Búsqueda | Typesense (autohospedado) |
| Archivos | Cloudflare R2 |
| Auth | Supabase Auth (Magic Link + OTP) |
| Despliegue | VPS Hetzner + Docker Compose + Caddy |

Techo previsto: **2 000 usuarios únicos/mes**. Un VPS cubre el volumen con margen.

## Requisitos

- Node.js **24** (`.nvmrc`)
- pnpm **9** (Corepack)
- Docker (opcional: Postgres, Redis, Typesense)

## Inicio rápido

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d          # opcional
pnpm --filter @udccerete/api dev
```

La API queda en `http://localhost:3001`. Salud: `/health`. Swagger: `/ui`. Guía completa: [docs/operations/local.md](docs/operations/local.md).

## Estructura del repositorio

```
apps/
  api/          # Hono 4 — API v1 (servidor activo)
  worker/       # BullMQ — colas y procesadores
  cms/          # Reservado para Payload CMS
packages/
  db/           # Drizzle — esquemas, migraciones y SQL de Supabase
  schemas/      # Zod / OpenAPI
  tsconfig/     # TypeScript compartido
docs/           # Arquitectura, API, operaciones, ADR
docker/         # Caddy y Dockerfile (esqueletos de producción)
```

## Principios

1. **API-first** — La API v1 se diseña antes que cualquier cliente.
2. **Contrato único** — Un esquema Zod genera validación, tipos y Swagger.
3. **Seguridad en la base** — RLS en PostgreSQL; políticas en `packages/db/supabase/rls.sql`.
4. **Sin estado en la API** — JWT sin consultar la base; trabajo diferido en colas.
5. **Portabilidad** — Compose reproducible; la API no vive en Vercel.

## Licencia

Software propietario de la Universidad de Cartagena (Centro Tutorial Cereté). Ver [LICENSE](LICENSE).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
