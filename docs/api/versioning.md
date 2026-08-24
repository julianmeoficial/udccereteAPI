# Versionado de la API

## Superficies

| Superficie | Uso | Consumidores |
|------------|-----|--------------|
| REST `/api/v1` | Contrato público documentado | Web, Expo, Huawei, terceros |
| tRPC | Interno al monorepo web (mismos validadores) | Next.js del blog |
| Webhooks | Eventos firmados | CMS, correo, tiendas de apps |

## REST pública

- Base path: **`/api/v1`**
- Documentación: OpenAPI + Swagger UI generados desde Zod (`@hono/zod-openapi`).
- La **v1 se congela** al publicarse; cambios rompientes abren **`/api/v2`**.
- Ningún cliente tiene endpoints exclusivos.

## Versionado semántico del paquete

El monorepo usa versiones `0.0.x` durante desarrollo inicial. La API REST usa el path `/api/v1`, no el campo `version` del `package.json`.

## Headers recomendados (futuro)

```
Accept: application/json
Authorization: Bearer <jwt>
X-Request-Id: <uuid>   # trazabilidad
```

## Referencias

- [Formato de errores](./errors.md)
- [ADR 0001](../adr/0001-stack-backend.md)
