# Despliegue

**Estado:** diseño (esqueletos en el repo) · **Actualizado:** 2026-08-28

La decisión de producción está en [ADR 0001](../adr/0001-stack-backend.md): API y workers en un **VPS Hetzner** con Docker Compose y Caddy; PostgreSQL y Auth en **Supabase**; archivos en **Cloudflare R2**. La API **no se despliega en Vercel** (hace falta proceso persistente para BullMQ).

## Qué hay hoy en el repo

| Artefacto | Estado |
|-----------|--------|
| `docker-compose.yml` | Solo Postgres 17, Redis 7 y Typesense 27.1 para **desarrollo local**. No incluye servicios `api` ni `worker`. |
| `docker/api.Dockerfile` | Esqueleto (`node:24-alpine`, imprime la versión de Node). |
| `docker/Caddyfile` | Comentario de ejemplo; sin host real. |
| GitHub Actions | [CI marcador de posición](ci.md). No hay job de deploy SSH. |

## Objetivo (cuando se implemente)

1. Imagen de `@udccerete/api` escuchando en `PORT` (predeterminado 3001).
2. Worker BullMQ en el mismo Compose.
3. Caddy como TLS y reverse proxy hacia la API.
4. Deploy: GitHub Actions → SSH al VPS.

Portabilidad (RNF): el backend se describe en Compose; restaurar Postgres y `docker compose up` en otro proveedor en ≤ 4 horas.

Hasta que existan imágenes y un workflow de deploy, el entorno ejecutable es el [desarrollo local](local.md).

## Referencias

- [ADR 0001](../adr/0001-stack-backend.md)
- [Visión general](../architecture/overview.md)
