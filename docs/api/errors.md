# Formato de errores

## Principio

Un **formato único** para toda la API: éxito y error comparten `meta` (`requestId`, `timestamp`). El cuerpo de error solo lleva `code`, `message` y `details`.

## Respuesta exitosa

```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-08-24T22:45:00.000Z"
  }
}
```

Las listas paginadas añaden `pagination` dentro de `meta`.

## Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "details": []
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-08-24T22:45:00.000Z"
  }
}
```

`details` siempre está presente: lista de `{ path, message }` en validación, vacía en el resto.

## Códigos de error (catálogo inicial)

| Código | HTTP | Descripción |
|--------|------|-------------|
| `VALIDATION_ERROR` | 400 | Esquema Zod falló |
| `UNAUTHORIZED` | 401 | JWT ausente o inválido |
| `FORBIDDEN` | 403 | RLS o rol insuficiente |
| `NOT_FOUND` | 404 | Recurso no existe o no visible por RLS |
| `RATE_LIMITED` | 429 | Límite Redis por usuario/IP |
| `INTERNAL_ERROR` | 500 | Error no recuperable |
| `SERVICE_DEGRADED` | 200/503 | Dependencia caída; respuesta parcial con aviso |

## Degradación elegante

Cuando Typesense o IA no responden:

- No devolver error opaco al usuario.
- Incluir `warning` en la respuesta o header `X-Service-Status`.
- Contenido estático disponible sigue sirviendo.

## Implementación

- Esquemas en `packages/schemas` (`ApiErrorSchema`, `SuccessResponseSchema`, `ResponseMetaSchema`).
- Helpers `ok` / `toApiError` en `apps/api`.
- Sentry captura `INTERNAL_ERROR` con `requestId` (fase posterior).

## Referencias

- [Versionado](./versioning.md)
