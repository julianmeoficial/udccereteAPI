# Trabajo asíncrono

**Estado:** implementado (colas + worker) · **Actualizado:** 2026-08-28

Redis y BullMQ están cableados. Sin `REDIS_URL`, la API encola en no-op (registro en log en desarrollo).

## Redis (producción)

Redis en el VPS cubrirá tres funciones:

1. **Caché** — respuestas frecuentes, degradación elegante.
2. **Límite de peticiones** — por usuario e IP; cuotas especiales para endpoints de IA.
3. **Respaldo de colas** — BullMQ para trabajo en segundo plano.

## Workers (`apps/worker`)

Paquete `@udccerete/worker` (BullMQ + ioredis + Sentry en dependencias). Colas implementadas:

| Cola / tarea | Destino | Descripción |
|--------------|---------|-------------|
| `search.reindex` | Typesense | Actualizar índice de búsqueda tras cambios de contenido |
| `notify.comment_reply` | Resend / bandeja de entrada | Aviso de respuesta a un comentario |
| `notify.post_comment` | Resend / bandeja de entrada | Aviso al autor de una publicación |
| `notify.urgent` | Resend / push | Cancelaciones y cambios de última hora |
| `mail.digest` | Resend | Resumen semanal por correo |
| `user.purge` | PostgreSQL | Borrado de cuenta programado |

Colas previstas para fases posteriores: sync Notion, push móvil (FCM / APNs / HMS).

## Flujo

```
API Hono → encola job → Redis/BullMQ → Worker → Typesense | Resend | DB
Cron programado → Redis/BullMQ → Worker
```

## Degradación

- Si Typesense no responde: la API devuelve contenido estático disponible y un aviso.
- Si Perplexity Sonar agota el tope mensual: degradar a búsqueda Typesense.
- Caché Redis 24 h por consulta normalizada de IA; máx. 10 consultas/usuario/día.

El código de error `SERVICE_DEGRADED` existe en el catálogo (HTTP 503). Ver [Errores](../api/errors.md).

## Desarrollo local

```bash
docker compose up -d redis
pnpm --filter @udccerete/worker dev
```

Variable: `REDIS_URL` en `.env` (ver `.env.example`). No es obligatoria para arrancar la API.

## Referencias

- [Visión general](./overview.md)
- [Desarrollo local](../operations/local.md)
