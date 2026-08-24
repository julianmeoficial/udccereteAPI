# Formato de errores

## Principio

Un **formato único de error** generado desde el esquema Zod, consistente en REST y tRPC.

## Estructura propuesta

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El cuerpo de la petición no es válido",
    "details": [
      {
        "path": "email",
        "message": "Correo institucional requerido"
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

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

## Implementación (fase posterior)

- Esquema Zod en `packages/schemas`.
- Helper en `apps/api` para mapear excepciones → formato uniforme.
- Sentry captura `INTERNAL_ERROR` con `requestId`.

## Referencias

- [Versionado](./versioning.md)
