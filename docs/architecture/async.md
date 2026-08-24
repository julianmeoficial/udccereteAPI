# Trabajo asíncrono

## Redis + BullMQ

Redis en el VPS cumple tres funciones:

1. **Caché** — respuestas frecuentes, degradación elegante.
2. **Rate limiting** — por usuario e por IP; cuotas especiales para endpoints de IA.
3. **Respaldo de colas** — BullMQ para trabajo en segundo plano.

## Workers (`apps/worker`)

| Cola / tarea | Destino | Descripción |
|--------------|---------|-------------|
| Indexado | Typesense | Actualizar índice de búsqueda tras cambios de contenido |
| Boletines | Resend | Envío masivo de newsletters |
| Sync Notion | PostgreSQL | Sincronización documental |
| Push | FCM / APNs / HMS | Notificaciones móviles |

## Flujo

```
API Hono → encola job → Redis/BullMQ → Worker → Typesense | Resend | DB | Push
Cron programado → Redis/BullMQ → Worker
```

## Degradación

- Si Typesense no responde: la API devuelve contenido estático disponible + aviso.
- Si Perplexity Sonar agota tope mensual: degradar a búsqueda Typesense.
- Caché Redis 24 h por consulta normalizada de IA; máx. 10 consultas/usuario/día.

## Desarrollo local

```bash
docker compose up -d redis
# Worker: pnpm --filter @udccerete/worker dev  (fase posterior)
```

Variables: `REDIS_URL` en `.env`.

## Referencias

- [Visión general](./overview.md)
- [Desarrollo local](../operations/local.md)
