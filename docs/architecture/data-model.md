# Modelo de datos

**Estado:** implementado (esquema Drizzle + migración inicial) · **Actualizado:** 2026-08-28

## Fuente de verdad

- Esquemas TypeScript: [`packages/db/src/schema/`](../../packages/db/src/schema/)
- Migraciones: [`packages/db/drizzle/`](../../packages/db/drizzle/)
- RLS y triggers Supabase: [`packages/db/supabase/`](../../packages/db/supabase/)

## Entidades (RD-001 – RD-011)

| ID | Tabla(s) | Descripción | Retención |
|----|----------|-------------|-----------|
| RD-001 | `profiles` | Usuario, rol, programa, preferencias | Vínculo + 1 año; borrado a solicitud |
| RD-002 | `posts`, `categories`, `tags` | Blog con taxonomía | Permanente (archivado, no borrado) |
| RD-003 | `comments`, `comment_reports` | Hilos y moderación | 2 años desde última interacción |
| RD-004 | `forum_opinions` | Opiniones **sin `user_id`** | 2 años; anonimato irreversible |
| RD-005 | `calendar_activities` | Calendario académico | Histórico 5 años |
| RD-006 | `events`, `event_registrations` | Eventos e inscripciones | 1 año post-evento |
| RD-007 | `resources`, `resource_versions` | Recursos académicos (R2) | Curso vigente + 2 años |
| RD-008 | `notification_subscriptions`, `notifications` | Push, correo, bandeja de entrada | Hasta revocación o 12 meses de inactividad |
| RD-009 | `analytics_events` | Analítica anonimizada | 14 meses |
| RD-010 | `wellbeing_routes` | Rutas de atención | Vigente por semestre |
| RD-011 | `audit_log` | Auditoría de acciones | 1 año |

Catálogo académico: `centers`, `programs`, `courses`, `tutors`.

Participación del usuario: `saved_posts`, `read_receipts`, `calendar_feed_tokens`, `search_zero_results`.

## Roles (`profiles.role`)

Valores alineados con `RoleSchema`: `super_admin`, `admin`, `editor`, `teacher`, `student`, `visitor`.

Autorización efectiva en **RLS** (`packages/db/supabase/rls.sql`). La API valida JWT y aplica permisos en código como segunda capa.

## Reglas de negocio en el esquema

- **RN-003:** `forum_opinions` no tiene columna `user_id`.
- **RN-008:** contenido publicado → `status = archived`, no DELETE.
- **RN-005:** `resources.scope` = `institutional | program | internal`.

## Próximo paso: Supabase

Ver [Conectar Supabase](../operations/supabase.md).
