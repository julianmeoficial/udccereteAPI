# Referencia de la API

Superficie HTTP **implementada hoy** en `@udccerete/api`. El contrato de tipos vive en `@udccerete/schemas`. Swagger se genera en runtime.

**Estado:** implementado (sondas y metadatos) · **Actualizado:** 2026-08-25

Arranque: ver [Desarrollo local](../operations/local.md). Por defecto: `http://localhost:3001`.

## Endpoints

| Método | Ruta | Rate limit | Descripción |
|--------|------|------------|-------------|
| `GET` | `/health` | No | Sonda para balanceadores. Equivale en cuerpo a `/api/v1/health`. |
| `GET` | `/api/v1/health` | Sí (`/api/*`) | Disponibilidad de la API v1. |
| `GET` | `/api/v1/meta` | Sí | Nombre, versión (`package.json` de `@udccerete/api`) y `NODE_ENV`. |
| `GET` | `/doc` | No | OpenAPI 3.1 en JSON. |
| `GET` | `/ui` | No | Swagger UI (`url: /doc`). |

Rutas desconocidas responden `404` con el [formato de error](errors.md) (`NOT_FOUND`).

No hay tRPC, webhooks, autenticación JWT ni recursos de dominio (posts, usuarios). Esos contratos están reservados en `packages/schemas` (`auth/`, `posts/`, `users/`) como módulos vacíos.

## Sobre JSON

Éxito: `{ "data": …, "meta": { "requestId", "timestamp" } }`.

Error: `{ "error": { "code", "message", "details" }, "meta": { "requestId", "timestamp" } }`.

Helpers: `ok`, `created`, `okPaginated` en `apps/api/src/lib/envelope.ts`. Detalle en [Errores](errors.md).

### `GET /api/v1/health`

```json
{
  "data": { "status": "ok" },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-25T00:00:00.000Z"
  }
}
```

### `GET /api/v1/meta`

```json
{
  "data": {
    "name": "API Blog UDEC Cereté",
    "version": "0.0.0",
    "environment": "development",
    "status": "ok"
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-25T00:00:00.000Z"
  }
}
```

## Headers

| Header | Dirección | Uso |
|--------|-----------|-----|
| `x-request-id` | Request / response | Si el cliente lo envía, se reutiliza; si no, la API genera un UUID. Expuesto en CORS. |
| `Authorization` | Request | Reservado para JWT. Aceptado en CORS; **aún no hay middleware de auth**. |
| `Content-Type` | Request | `application/json` cuando haya cuerpo. |
| `Retry-After` | Response | Segundos hasta reintentar, solo en `429`. |

`meta.requestId` coincide con `x-request-id`.

## CORS

Variable `CORS_ORIGIN`: lista separada por comas. Default de desarrollo: `http://localhost:3000,http://localhost:5173`.

- Credenciales activas salvo que la lista incluya `*`.
- Headers permitidos: `Content-Type`, `Authorization`, `x-request-id`.
- Header expuesto: `x-request-id`.

## Rate limit

Middleware en memoria, **por proceso**, ventana fija. Aplica solo a `/api/*` (no a `/health`, `/doc` ni `/ui`). Ignora `OPTIONS`.

| Variable | Default | Significado |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana en milisegundos |
| `RATE_LIMIT_MAX` | `100` | Peticiones por clave e intervalo |

Clave: primer IP de `x-forwarded-for`, si no `x-real-ip`, si no `local`. Al superar el cupo: `429` + `RATE_LIMITED`. En producción se prevé gateway y/o Redis (`REDIS_URL`); hoy Redis no participa.

## Esquemas compartidos (`@udccerete/schemas`)

| Módulo | Estado |
|--------|--------|
| `common/error`, `response`, `pagination`, `params`, `query`, `role`, `file` | Implementado |
| `auth/`, `posts/`, `users/` | Reservados (exportan vacío) |

Roles en contrato: `super_admin`, `admin`, `editor`, `teacher`, `student`, `visitor`.

Paginación (cuando existan listados): query `page` (default 1) y `pageSize` (default 20, máx. 100); `meta.pagination` con `page`, `pageSize`, `total`, `totalPages`.

## Código de referencia

| Pieza | Ruta |
|-------|------|
| App y middlewares | `apps/api/src/app.ts` |
| Rutas v1 | `apps/api/src/routes/v1/` |
| OpenAPI / Swagger | `apps/api/src/openapi.ts` |
| Contratos | `packages/schemas/src/` |

## Referencias

- [Versionado](versioning.md)
- [Errores](errors.md)
- [ADR 0001](../adr/0001-stack-backend.md)
