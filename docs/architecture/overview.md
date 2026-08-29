# Visión general de la arquitectura

**Estado:** mixto (runtime v1 implementado; integraciones cloud pendientes de credenciales) · **Actualizado:** 2026-08-28

## Enfoque

El backend es un servicio **API-first, TypeScript de punta a punta**, desacoplado de web y apps móviles. Es la **fuente única de verdad** para cuatro clientes (en repos aparte):

- Web pública (Next.js)
- Expo iOS y Android
- App nativa HUAWEI (ArkTS / HMS)

## Principios

| Principio | Práctica |
|-----------|----------|
| API-first | La API v1 se diseña y documenta antes que cualquier cliente |
| Contrato único | Zod → validación, tipos TS, Swagger, SDK de cliente (SDK aún no) |
| Monorepo | Turborepo + pnpm en este repo; clientes fuera |
| Seguridad en la base | RLS en PostgreSQL (**tablas y políticas: pendientes**) |
| Sin estado en la API | JWT validados sin consultar DB; colas para trabajo diferido (**JWT y colas: pendientes**) |
| Costo predecible | VPS con tráfico incluido; sin facturación por invocación |
| Portabilidad | `docker-compose.yml` reproducible en otro proveedor |

## Regla de oro

> El HTML sale de la CDN, los archivos salen de R2 y **solo lo dinámico toca la API**.

Si una visita típica al blog obliga a ejecutar una función o consultar Postgres, algo está mal configurado.

## Qué hay en este repositorio

```
apps/api         → Hono 4: REST /api/v1, OpenAPI, middlewares (implementado)
apps/worker      → BullMQ (stub: sin procesadores)
apps/cms         → Placeholder Payload CMS
packages/db      → Drizzle ORM (config; sin esquemas ni migraciones)
packages/schemas → Zod + OpenAPI (contratos comunes implementados)
packages/tsconfig → TypeScript compartido
```

Detalle de HTTP: [Referencia de la API](../api/README.md).

## Implementado vs pendiente

| Pieza | Estado |
|-------|--------|
| Servidor Hono, dominio `/api/v1`, OpenAPI, auth JWT, Drizzle | Implementado |
| Workers BullMQ, adaptadores R2/Typesense/Resend/VAPID | Implementado (degradación sin env) |
| RLS en Supabase | SQL listo; aplicar en cloud |
| tRPC, Payload CMS, Perplexity Sonar | Pendiente / stub |

## Infraestructura (producción, decisión)

| Pieza | Ubicación |
|-------|-----------|
| API, Redis, BullMQ, Typesense | VPS Hetzner (Docker + Caddy) |
| PostgreSQL, Auth | Supabase |
| Archivos | Cloudflare R2 |
| DNS, WAF, caché | Cloudflare |
| CI/CD | GitHub Actions → deploy SSH al VPS |
| Observabilidad | Sentry |

Hoy el Compose local solo levanta Postgres, Redis y Typesense. Ver [Despliegue](../operations/deploy.md).

## Clientes y servicios externos (fuera de este repo o futuros)

- **Payload CMS** — editorial sobre el mismo Postgres (`apps/cms`, placeholder)
- **Perplexity Sonar** — RAG con caché Redis y límites por usuario
- **Crossref, OpenAlex, Open Library** — metadatos de citas
- **Resend** — SMTP de Magic Link vía Supabase
- **FCM, APNs, HMS Push** — notificaciones

## Referencias

- [Autenticación](./auth.md)
- [Trabajo asíncrono](./async.md)
- [ADR 0001 — Stack backend](../adr/0001-stack-backend.md)
- [Índice de docs](../README.md)
