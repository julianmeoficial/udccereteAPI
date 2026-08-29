# Formato de errores

**Estado:** implementado · **Actualizado:** 2026-08-28

## Códigos de error

| Código | HTTP | Cuándo |
|--------|------|--------|
| `VALIDATION_ERROR` | 400 | Esquema Zod / OpenAPI |
| `UNAUTHORIZED` | 401 | JWT ausente o inválido |
| `FORBIDDEN` | 403 | Rol insuficiente o correo no institucional |
| `NOT_FOUND` | 404 | Ruta o recurso inexistente |
| `CONFLICT` | 409 | Duplicado (slug, inscripción, etc.) |
| `PAYLOAD_TOO_LARGE` | 413 | Archivo > 25 MB |
| `RATE_LIMITED` | 429 | Límite por IP |
| `INTERNAL_ERROR` | 500 | Error no recuperable |
| `SERVICE_DEGRADED` | 503 | DB/Redis/Typesense/R2/IA no disponible |

## Degradación

Cuando Typesense, R2 o la IA no respondan, la API intenta una alternativa (por ejemplo, búsqueda SQL) o responde `SERVICE_DEGRADED` con un mensaje claro; nunca un 500 opaco al cliente.

## Referencias

- [Superficie HTTP](./README.md)
- Esquemas: `packages/schemas/src/common/error.schema.ts`
