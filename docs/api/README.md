# Referencia de la API

Superficie HTTP de `@udccerete/api`. Contratos en `@udccerete/schemas`. OpenAPI en `/doc`, Swagger UI en `/ui`.

**Estado:** implementado (dominio v1 + auth JWT) · **Actualizado:** 2026-08-28

Arranque: [Desarrollo local](../operations/local.md). Default: `http://localhost:3001`.

## Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness (balanceador) |
| `GET` | `/api/v1/health` | No | Readiness + checks DB/Redis |
| `GET` | `/api/v1/meta` | No | Nombre, versión, entorno |
| `GET` | `/feed.xml` | No | RSS del blog |
| `GET` | `/doc` | No | OpenAPI 3.1 JSON |
| `GET` | `/ui` | No | Swagger UI |

## Sesión y perfil

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/me` | JWT | Perfil autenticado |
| `PATCH` | `/api/v1/me` | JWT | Actualizar perfil |
| `DELETE` | `/api/v1/me` | JWT | Solicitar borrado (15 días) |
| `GET` | `/api/v1/me/saved` | JWT | Publicaciones guardadas |
| `PUT` | `/api/v1/posts/:id/save` | JWT | Guardar publicación |
| `DELETE` | `/api/v1/posts/:id/save` | JWT | Quitar de guardados |
| `POST` | `/api/v1/posts/:id/read` | JWT | Marcar como leída |

## Blog

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/posts` | Opcional | Listado (público: solo `published`) |
| `GET` | `/api/v1/posts/:slug` | Opcional | Detalle por slug |
| `POST` | `/api/v1/posts` | Editor+ | Crear |
| `PATCH` | `/api/v1/posts/:id` | Editor+ | Actualizar |
| `POST` | `/api/v1/posts/:id/archive` | Editor+ | Archivar (RN-008) |
| `GET` | `/api/v1/categories` | No | Categorías |
| `GET` | `/api/v1/tags` | No | Etiquetas |

## Comentarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/posts/:postId/comments` | No | Hilos |
| `POST` | `/api/v1/posts/:postId/comments` | Estudiante+ institucional | Comentar |
| `PATCH` | `/api/v1/moderation/comments/:id` | Moderador | Aprobar/ocultar |

## Búsqueda

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/search` | No | Typesense; fallback SQL + aviso |

## Calendario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/calendar` | No | Actividades filtrables |
| `GET` | `/api/v1/calendar.ics` | No | Exportación iCal |
| `GET` | `/api/v1/calendar/feed/:token` | Token | Suscripción iCal firmada |
| `POST/PATCH/DELETE` | `/api/v1/calendar` | Staff | CRUD actividades |
| `POST` | `/api/v1/calendar/import` | Staff | Import CSV |

## Eventos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET/POST/PATCH/DELETE` | `/api/v1/events` | Mixto | CRUD eventos |
| `POST/DELETE` | `/api/v1/events/:id/registrations` | Institucional | Inscripción |

## Recursos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/resources` | Opcional | Listado (alcance RN-005) |
| `POST` | `/api/v1/resources` | Docente+ | Metadata + URL prefirmada R2 |
| `GET` | `/api/v1/resources/:id/download` | Según alcance | URL de descarga |

## Bienestar

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/wellbeing/routes` | **No** (RN-007) | Directorio de atención |
| `PUT` | `/api/v1/wellbeing/routes/:id` | Staff | Actualizar ruta |

## Foro (opiniones anónimas)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/forum/opinions` | No | Opiniones aprobadas |
| `GET` | `/api/v1/forum/summary` | No | Resumen por curso/tutor |
| `POST` | `/api/v1/forum/opinions` | Institucional | Enviar (sin user_id en DB) |
| `PATCH` | `/api/v1/moderation/forum/:id` | Moderador | Moderación previa |

## Notificaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/notifications` | JWT | Inbox |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT | Marcar leída |
| `POST` | `/api/v1/push/subscriptions` | JWT | Web Push (VAPID) |

## Citas académicas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/citations` | No | APA7/Vancouver vía Crossref |

## Administración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/users` | SuperAdmin | Usuarios |
| `PATCH` | `/api/v1/admin/users/:id/role` | SuperAdmin | Asignar rol |
| `GET` | `/api/v1/admin/audit` | SuperAdmin | Auditoría |
| `GET` | `/api/v1/admin/analytics` | Admin+ | Resumen analítica |

## IA (stub)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/ai/ask` | JWT | `503 SERVICE_DEGRADED` (fase posterior) |

## Sobre JSON

Éxito: `{ "data", "meta" }`. Error: `{ "error", "meta" }`. Ver [Errores](errors.md).

Excepciones sin sobre JSON: `/feed.xml`, `/api/v1/calendar.ics`.

## Headers

| Header | Uso |
|--------|-----|
| `Authorization: Bearer <JWT>` | Supabase Auth |
| `x-request-id` | Trazabilidad (UUID) |

## CORS y rate limit

Ver configuración en [README anterior](./README.md) — `CORS_ORIGIN`, `RATE_LIMIT_*`.

## Referencias

- [Errores](errors.md)
- [Versionado](versioning.md)
- [Conectar Supabase](../operations/supabase.md)
