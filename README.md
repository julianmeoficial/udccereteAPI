# API UDEC Cereté

Backend **API-first** del Blog UDEC Cereté (Centro Tutorial Cereté, Universidad de Cundinamarca). Fuente única de verdad para los clientes: web pública (Next.js), Expo iOS/Android y app nativa HUAWEI.

> **Fase 0:** este repositorio contiene solo estructura, documentación y dependencias. **Aún no hay servidor ni endpoints.**

## Especificación

La documentación técnica completa del backend está en Notion:

- [API UDEC Cereté — Stack y arquitectura](https://app.notion.com/p/3c68b2d8659c809fa107d5347729b850)

## Stack (decisiones cerradas — agosto 2026)

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 24 LTS + TypeScript 5 |
| Monorepo | Turborepo + pnpm workspaces |
| API | Hono 4 — REST `/api/v1`, tRPC interno, webhooks |
| Contratos | Zod + OpenAPI |
| Base de datos | Supabase PostgreSQL 17 + Drizzle ORM + RLS |
| Caché / colas | Redis + BullMQ |
| Búsqueda | Typesense (autohospedado) |
| Archivos | Cloudflare R2 |
| Auth | Supabase Auth (Magic Link + OTP) |
| Despliegue | VPS Hetzner + Docker Compose + Caddy |

## Dimensionamiento

Techo del sistema: **2 000 usuarios únicos/mes** (~120 000 peticiones a la API). Un solo VPS cubre el volumen con margen.

## Requisitos

- Node.js **24** (ver `.nvmrc`)
- pnpm **9** (habilitado vía Corepack)
- Docker (opcional, para infra local: Postgres, Redis, Typesense)

## Inicio rápido

```bash
# Clonar e instalar
git clone <repo-url>
cd udccereteAPI
corepack enable
pnpm install

# Infra local (opcional)
docker compose up -d

# Copiar variables de entorno
cp .env.example .env
```

Los scripts `dev`, `build` y `typecheck` están configurados con Turborepo pero **no levantan un servidor** hasta la siguiente fase.

## Estructura del repositorio

```
apps/
  api/          # Hono 4 — API v1
  worker/       # BullMQ workers
  cms/          # Placeholder Payload CMS (futuro)
packages/
  db/           # Drizzle ORM + migraciones
  schemas/      # Zod / contratos OpenAPI
  tsconfig/     # Configuración TypeScript compartida
docs/
  architecture/ # Visión, auth, async
  api/          # Versionado, errores
  operations/   # Desarrollo local, despliegue
  adr/          # Architecture Decision Records
docker/         # Caddy, Dockerfiles
```

## Principios

1. **API-first** — La API v1 se diseña antes que cualquier cliente.
2. **Contrato único** — Un esquema Zod genera validación, tipos, Swagger y SDK.
3. **Seguridad en la base** — RLS en PostgreSQL; un error en la app no expone datos de otro usuario.
4. **Sin estado en la API** — JWT validados sin consultar la base; trabajo diferido en colas.
5. **Portabilidad** — `docker-compose.yml` reproducible; la API no vive en Vercel.

## Licencia

Software propietario de la Universidad de Cartagena (Centro Tutorial Cereté). Ver [LICENSE](LICENSE).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
