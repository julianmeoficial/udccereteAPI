# Versionado de la API

**Estado:** vigente para REST v1 · **Actualizado:** 2026-08-28

## Superficies

| Superficie | Uso | Estado | Consumidores |
|------------|-----|--------|--------------|
| REST `/api/v1` | Contrato público documentado | Implementado (dominio v1) | Web, Expo, Huawei, terceros |
| OpenAPI `/doc` + Swagger `/ui` | Spec generada desde Zod/Hono | Implementado | Humanos y herramientas |
| tRPC | Interno al monorepo web (mismos validadores) | Pendiente (`@hono/trpc-server` en deps) | Next.js del blog |
| Webhooks | Eventos firmados | Pendiente | CMS, correo, tiendas de apps |

## REST pública

- Base path: **`/api/v1`**
- Documentación viva: OpenAPI 3.1 en `GET /doc`, UI en `GET /ui` (`@hono/zod-openapi`).
- La **v1 se congela** al publicarse; los cambios rompientes abren **`/api/v2`**.
- Ningún cliente tiene endpoints exclusivos.

Lista de rutas: [Referencia de la API](./README.md).

## Versionado semántico del paquete

El monorepo usa `0.0.x` durante el desarrollo inicial (`apps/api/package.json`). El path REST `/api/v1` **no** es el campo `version` de npm; `GET /api/v1/meta` expone esa versión de paquete en `data.version`.

## Headers

```
Accept: application/json
Authorization: Bearer <jwt>    # JWT de Supabase Auth
x-request-id: <uuid>           # opcional; si falta, la API lo genera
```

## Referencias

- [Superficie actual](./README.md)
- [Formato de errores](./errors.md)
- [ADR 0001](../adr/0001-stack-backend.md)
