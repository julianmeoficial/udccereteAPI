# Autenticación y autorización

**Estado:** implementado (middleware JWT + permisos) · **Actualizado:** 2026-08-28

La API valida JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`. Sin JWKS en desarrollo, acepta tokens de prueba (ver [Desarrollo local](../operations/local.md)).

## Flujo de acceso (Magic Link + OTP)

1. El usuario escribe su correo institucional (`@unicartagena.edu.co`).
2. Supabase Auth solicita el envío vía **Resend** (SPF, DKIM y DMARC propios).
3. El usuario recibe Magic Link y OTP de 6 dígitos en la misma pantalla.
4. Al abrir el enlace o enviar el OTP, Supabase emite JWT (1 h) y refresh token rotatorio.
5. El cliente envía `Authorization: Bearer <JWT>` a la API.
6. Hono valida la firma con la **clave pública / JWKS** de Supabase (sin consultar la base).
7. Las consultas a PostgreSQL aplican **RLS** según el rol del usuario (cuando las políticas están activas en Supabase).

## Salvaguardas

- Enlace válido **15 minutos**, un solo uso.
- OTP de 6 dígitos como alternativa (cambio de dispositivo, clientes de correo que consumen el enlace).
- Límite de **3 solicitudes por correo cada 15 minutos**.
- Dominio institucional con verificación reforzada para roles de edición.
- Sesión recordada **30 días** en dispositivos confiables.

## Roles

Valores de contrato (`RoleSchema` en `@udccerete/schemas`):

| Rol API | Alcance previsto |
|---------|------------------|
| `super_admin` | Sistema completo |
| `admin` | Su centro tutorial |
| `editor` | Contenido asignado (editor / blogger) |
| `teacher` | Recursos y perfil (docente) |
| `student` | Lectura y participación limitada |
| `visitor` | Lectura pública |

La autorización efectiva vive en **RLS** (PostgreSQL), con una segunda capa en la API. No usar `user_metadata` del JWT para autorizar; usar `app_metadata`.

## Implementación en la API

- Validación JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`.
- Middleware Hono que extrae `sub`, rol y centro del token.
- Matriz de permisos en `apps/api/src/lib/permissions.ts`.
- Service role key solo en workers; nunca en clientes ni en la API pública.
- Header `Authorization` permitido en CORS.

## Referencias

- [Visión general](./overview.md)
- [Referencia de la API](../api/README.md)
- [Conectar Supabase](../operations/supabase.md)
- [ADR 0001](../adr/0001-stack-backend.md)
