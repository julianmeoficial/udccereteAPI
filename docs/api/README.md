# Referencia de la API

Superficie HTTP de `@udccerete/api`. Contratos en `@udccerete/schemas`. OpenAPI en `/doc`, Swagger UI en `/ui`.

**Estado:** implementado (dominio v1 + auth JWT) · **Actualizado:** 2026-08-28

Arranque: [Desarrollo local](../operations/local.md). Por defecto: `http://localhost:3001`.

## Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness (balanceador de carga) |
| `GET` | `/api/v1/health` | No | Disponibilidad + comprobaciones DB/Redis |
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
| `GET` | `/api/v1/search` | No | Typesense; alternativa SQL + aviso |

## Calendario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/calendar` | No | Actividades filtrables |
| `GET` | `/api/v1/calendar.ics` | No | Exportación iCal |
| `GET` | `/api/v1/calendar/feed/:token` | Token | Suscripción iCal firmada |
| `POST/PATCH/DELETE` | `/api/v1/calendar` | Editor+ | CRUD de actividades |
| `POST` | `/api/v1/calendar/import` | Editor+ | Importación CSV |

## Eventos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET/POST/PATCH/DELETE` | `/api/v1/events` | Variable | CRUD de eventos |
| `POST/DELETE` | `/api/v1/events/:id/registrations` | Institucional | Inscripción |

## Recursos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/resources` | Opcional | Listado (alcance RN-005) |
| `POST` | `/api/v1/resources` | Docente+ | Metadatos + URL prefirmada R2 |
| `GET` | `/api/v1/resources/:id/download` | Según alcance | URL de descarga |

## Bienestar

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/wellbeing/routes` | **No** (RN-007) | Directorio de atención |
| `PUT` | `/api/v1/wellbeing/routes/:id` | Editor+ | Actualizar ruta |

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
| `GET` | `/api/v1/notifications` | JWT | Bandeja de entrada |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT | Marcar leída |
| `POST` | `/api/v1/push/subscriptions` | JWT | Web Push (VAPID) |

## Citas académicas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/citations` | No | APA7/Vancouver vía Crossref |

## Administración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/users` | `super_admin` | Usuarios |
| `PATCH` | `/api/v1/admin/users/:id/role` | `super_admin` | Asignar rol |
| `GET` | `/api/v1/admin/audit` | `super_admin` | Auditoría |
| `GET` | `/api/v1/admin/analytics` | Admin+ | Resumen de analítica |

## IA (reservado)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/ai/ask` | JWT | `503 SERVICE_DEGRADED` (fase posterior) |

## Sobre JSON

Éxito: `{ "data", "meta" }`. Error: `{ "error", "meta" }`. Ver [Errores](errors.md).

Excepciones sin sobre JSON: `/feed.xml`, `/api/v1/calendar.ics`.

## Headers

| Header | Dirección | Uso |
|--------|-----------|-----|
| `Authorization: Bearer <JWT>` | Request | Supabase Auth |
| `x-request-id` | Request / response | Trazabilidad (UUID); se reutiliza si el cliente lo envía |
| `Content-Type` | Request | `application/json` cuando hay cuerpo |
| `Retry-After` | Response | Segundos hasta reintentar, solo en `429` |

## CORS

Variable `CORS_ORIGIN`: lista separada por comas. Valor predeterminado en desarrollo: `http://localhost:3000,http://localhost:5173`.

- Credenciales activas salvo que la lista incluya `*`.
- Headers permitidos: `Content-Type`, `Authorization`, `x-request-id`.
- Header expuesto: `x-request-id`.

## Límite de peticiones

Middleware en memoria, **por proceso**, ventana fija. Aplica solo a `/api/*` (no a `/health`, `/doc` ni `/ui`). Ignora `OPTIONS`.

| Variable | Predeterminado | Significado |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana en milisegundos |
| `RATE_LIMIT_MAX` | `100` | Peticiones por clave e intervalo |

Clave: primer IP de `x-forwarded-for`; si no, `x-real-ip`; si no, `local`. Al superar el cupo: `429` + `RATE_LIMITED`. En producción se prevé gateway y/o Redis.

## Referencias

- [Errores](errors.md)
- [Versionado](versioning.md)
- [Conectar Supabase](../operations/supabase.md)
