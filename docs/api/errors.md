# Formato de errores

**Estado:** implementado · **Actualizado:** 2026-08-25

## Principio

Un **formato único** para toda la API: éxito y error comparten `meta` (`requestId`, `timestamp`). El cuerpo de error solo lleva `code`, `message` y `details`.

Esquemas: `ApiErrorSchema`, `SuccessResponseSchema`, `ResponseMetaSchema` en `@udccerete/schemas`. HTTP: `API_ERROR_STATUS` en el mismo paquete.

## Respuesta exitosa

```json
{
  "data": {},
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-24T22:45:00.000Z"
  }
}
```

Las listas paginadas añaden `pagination` dentro de `meta` (`PaginatedResponseSchema`). Aún no hay endpoints de listado.

## Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "details": []
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-24T22:45:00.000Z"
  }
}
```

`details` **siempre** está presente: lista de `{ path, message }` en validación, array vacío en el resto. `path` usa notación punto; si el fallo no tiene ruta, `(root)`.

## Códigos de error

| Código | HTTP | Cuándo |
|--------|------|--------|
| `VALIDATION_ERROR` | 400 | Esquema Zod / hook OpenAPI, o status HTTP 4xx no mapeado |
| `UNAUTHORIZED` | 401 | JWT ausente o inválido (cuando exista auth) |
| `FORBIDDEN` | 403 | RLS o rol insuficiente (cuando exista auth) |
| `NOT_FOUND` | 404 | Ruta o recurso inexistente (`notFoundHandler`) |
| `RATE_LIMITED` | 429 | Límite del middleware en memoria |
| `INTERNAL_ERROR` | 500 | Error no recuperable |
| `SERVICE_DEGRADED` | 503 | Dependencia caída (código listo; ningún handler lo emite aún) |

`AppError` en `apps/api/src/lib/errors.ts` mapea `code` → status. `HTTPException` de Hono se traduce con `codeFromHttpStatus`.

En desarrollo, los 500 se registran con el error completo en consola; en producción solo `{ requestId, message: 'INTERNAL_ERROR' }`. Sentry está en dependencias; **no está cableado** al handler.

## Degradación elegante (diseño)

Cuando Typesense o IA no respondan:

- No devolver un error opaco al usuario si hay contenido estático.
- Opción de `warning` en la respuesta o header `X-Service-Status`.
- Si el servicio no puede cumplir: `SERVICE_DEGRADED` con **503** (el catálogo no usa 200 para este código).

## Implementación

| Pieza | Dónde |
|-------|--------|
| Esquemas | `packages/schemas/src/common/error.schema.ts` |
| `ok` / `toApiError` / `AppError` | `apps/api/src/lib/` |
| Handler global y 404 | `apps/api/src/middleware/error.ts` |
| Validación OpenAPI → `VALIDATION_ERROR` | `apps/api/src/middleware/validation.ts` |

## Referencias

- [Superficie actual](./README.md)
- [Versionado](./versioning.md)
