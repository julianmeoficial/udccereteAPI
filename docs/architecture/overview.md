# Visión general de la arquitectura

## Enfoque

El backend es un servicio **API-first, TypeScript end-to-end**, desacoplado de web y apps móviles. Actúa como **fuente única de verdad** para cuatro clientes:

- Web pública (Next.js)
- Expo iOS y Android
- App nativa HUAWEI (ArkTS / HMS)

## Principios

| Principio | Práctica |
|-----------|----------|
| API-first | La API v1 se diseña y documenta antes que cualquier cliente |
| Contrato único | Zod → validación, tipos TS, Swagger, SDK de cliente |
| Monorepo | Turborepo + pnpm en este repo (backend); clientes en repos separados |
| Seguridad en la base | RLS en PostgreSQL |
| Sin estado en la API | JWT validados sin consultar DB; colas para trabajo diferido |
| Costo predecible | VPS con tráfico incluido; sin facturación por invocación |
| Portabilidad | `docker-compose.yml` reproducible en otro proveedor |

## Regla de oro

> El HTML sale de la CDN, los archivos salen de R2 y **solo lo dinámico toca la API**.

Si una visita típica al blog obliga a ejecutar una función o consultar Postgres, algo está mal configurado.

## Componentes en este repositorio

```
apps/api      → Hono 4, REST /api/v1, tRPC interno, webhooks
apps/worker   → BullMQ: índices, boletines, sync Notion, push
packages/db   → Drizzle ORM, migraciones
packages/schemas → Zod, contratos OpenAPI
```

## Infraestructura (producción)

| Pieza | Ubicación |
|-------|-----------|
| API, Redis, BullMQ, Typesense | VPS Hetzner (Docker + Caddy) |
| PostgreSQL, Auth | Supabase |
| Archivos | Cloudflare R2 |
| DNS, WAF, caché | Cloudflare (plan gratuito) |
| CI/CD | GitHub Actions → deploy SSH al VPS |
| Observabilidad | Sentry |

## Clientes externos (fuera de este repo)

- **Payload CMS** — capa editorial sobre el mismo Postgres (futuro en `apps/cms`)
- **Perplexity Sonar** — RAG con caché Redis y límites por usuario
- **Crossref, OpenAlex, Open Library** — metadatos para generador de citas
- **Resend** — SMTP de Magic Link vía Supabase
- **FCM, APNs, HMS Push** — notificaciones

## Diagrama

Ver la spec completa en Notion para diagramas Mermaid de arquitectura, autenticación y trabajo asíncrono.

## Referencias

- [Autenticación](./auth.md)
- [Trabajo asíncrono](./async.md)
- [ADR 0001 — Stack backend](../adr/0001-stack-backend.md)
