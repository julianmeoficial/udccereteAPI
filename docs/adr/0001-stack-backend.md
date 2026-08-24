# ADR 0001 — Stack backend cerrado

- **Estado:** Aceptado
- **Fecha:** 2026-08-24
- **Contexto:** Propuesta técnica v4 — Blog UDEC Cereté

## Contexto

El backend debe soportar web, Expo (iOS/Android) y app HUAWEI con un solo contrato, techo de 2 000 usuarios/mes, costo predecible y portabilidad ante cambio de proveedor. El equipo es pequeño y rotativo; se prioriza TypeScript end-to-end y operación simple.

## Decisión

### Núcleo

| Tecnología | Rol |
|------------|-----|
| **Hono 4** | Framework API v1 |
| **Node.js 24 LTS** | Runtime API y workers |
| **TypeScript 5** | Lenguaje único |
| **Zod + OpenAPI** | Contratos |
| **Turborepo + pnpm** | Monorepo backend |

### Datos

| Tecnología | Rol |
|------------|-----|
| **Supabase PostgreSQL 17** | Base principal |
| **Drizzle ORM** | Acceso y migraciones |
| **RLS** | Autorización en fila |
| **Redis** | Caché, rate limit, colas |
| **BullMQ** | Jobs en background |
| **Cloudflare R2** | Archivos (egress cero) |

### Auth

| Tecnología | Rol |
|------------|-----|
| **Supabase Auth** | Magic Link + OTP |
| **Resend** | SMTP de correos de acceso |
| **jose** | Validación JWT en API |

### Servicios de apoyo

| Tecnología | Rol |
|------------|-----|
| **Typesense** (autohospedado) | Búsqueda |
| **Payload CMS** (futuro) | Editorial |
| **Perplexity Sonar** | RAG con límites |
| **Sentry** | Observabilidad |

### Infra

| Tecnología | Rol |
|------------|-----|
| **VPS Hetzner** | API, Redis, workers, Typesense |
| **Docker Compose + Caddy** | Empaquetado y HTTPS |
| **Cloudflare** | DNS, WAF, caché |
| **GitHub Actions** | CI/CD → SSH al VPS |

## Alternativas consideradas (descartadas)

| Alternativa | Por qué no |
|-------------|------------|
| Vercel Functions para API | Sin proceso persistente para BullMQ; facturación por invocación |
| NestJS / Express solo | Hono: menor RAM, OpenAPI+Zod nativo, portabilidad multi-runtime |
| Prisma | Drizzle: SQL-first, migraciones ligeras, RLS-friendly |
| Typesense Cloud | Costo; volumen cubierto en VPS |
| Contraseñas tradicionales | Magic Link + OTP; menos superficie de ataque |

## Consecuencias

### Positivas

- Un contrato para todos los clientes.
- Costo fijo en VPS con 20 TB incluidos.
- Portabilidad vía Docker.
- RLS auditable en Postgres.

### Negativas

- VPS como punto único de fallo (mitigado con backups y compose reproducible).
- Administración del VPS (mitigado con Caddy, parches y Actions).
- Payload CMS pendiente de integración sin arrastrar Next.js en Fase 0.

## Referencias

- [Notion — API UDEC Cereté](https://app.notion.com/p/3c68b2d8659c809fa107d5347729b850)
- [Visión general](../architecture/overview.md)
