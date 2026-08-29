# Autenticación y autorización

**Estado:** implementado (middleware JWT + permisos) · **Actualizado:** 2026-08-28

La API valida JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`. Sin JWKS en desarrollo, acepta tokens de prueba (ver [local](../operations/local.md)).

## Flujo de acceso (Magic Link + OTP)

1. El usuario escribe su correo institucional (`@unicartagena.edu.co`).
2. Supabase Auth solicita el envío vía **Resend** (SPF/DKIM/DMARC propios).
3. El usuario recibe Magic Link y OTP de 6 dígitos en la misma pantalla.
4. Al abrir el enlace o enviar el OTP, Supabase emite JWT (1 h) + refresh token rotatorio.
5. El cliente envía `Authorization: Bearer <JWT>` a la API.
6. Hono validará la firma con la **clave pública / JWKS** de Supabase (sin consultar la DB).
7. Las consultas a PostgreSQL aplicarán **RLS** según el rol del usuario.

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
| `visitor` | Lectura y participación limitada |

La autorización efectiva se implementará en **RLS** (PostgreSQL), no solo en la capa de aplicación. No usar `user_metadata` del JWT para autorizar; usar `app_metadata`.

## Implementación prevista en la API

- Validación JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`.
- Middleware Hono que extraiga `sub`, rol y centro del token.
- Service role key solo en workers; nunca en clientes ni en la API pública.
- Header `Authorization` ya está permitido en CORS.

## Referencias

- [Visión general](./overview.md)
- [Referencia de la API](../api/README.md)
- [ADR 0001](../adr/0001-stack-backend.md)
