# Trabajo asíncrono

**Estado:** implementado (colas + worker) · **Actualizado:** 2026-08-28

Redis y BullMQ están cableados. Sin `REDIS_URL`, la API encola en no-op (log en dev).

## Redis (producción)

Redis en el VPS cubrirá tres funciones:

1. **Caché** — respuestas frecuentes, degradación elegante.
2. **Rate limiting** — por usuario e IP; cuotas especiales para endpoints de IA.
3. **Respaldo de colas** — BullMQ para trabajo en segundo plano.

## Workers (`apps/worker`)

Paquete `@udccerete/worker` (BullMQ + ioredis + Sentry en dependencias). Colas previstas:

| Cola / tarea | Destino | Descripción |
|--------------|---------|-------------|
| Indexado | Typesense | Actualizar índice de búsqueda tras cambios de contenido |
| Boletines | Resend | Envío masivo de newsletters |
| Sync Notion | PostgreSQL | Sincronización documental |
| Push | FCM / APNs / HMS | Notificaciones móviles |

## Flujo previsto

```
API Hono → encola job → Redis/BullMQ → Worker → Typesense | Resend | DB | Push
Cron programado → Redis/BullMQ → Worker
```

## Degradación (diseño)

- Si Typesense no responde: la API devuelve contenido estático disponible + aviso.
- Si Perplexity Sonar agota el tope mensual: degradar a búsqueda Typesense.
- Caché Redis 24 h por consulta normalizada de IA; máx. 10 consultas/usuario/día.

El código de error `SERVICE_DEGRADED` ya existe en el catálogo (HTTP 503). Ver [Errores](../api/errors.md).

## Desarrollo local

```bash
docker compose up -d redis
# Cuando existan procesadores:
# pnpm --filter @udccerete/worker dev
```

Variable: `REDIS_URL` en `.env` (ver `.env.example`). Hoy no es requerida para arrancar la API.

## Referencias

- [Visión general](./overview.md)
- [Desarrollo local](../operations/local.md)
