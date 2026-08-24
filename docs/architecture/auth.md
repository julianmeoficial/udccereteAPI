# Autenticación y autorización

## Flujo de acceso (Magic Link + OTP)

1. El usuario escribe su correo institucional (`@ucundinamarca.edu.co`).
2. Supabase Auth solicita envío vía **Resend** (SPF/DKIM/DMARC propios).
3. El usuario recibe Magic Link y OTP de 6 dígitos en la misma pantalla.
4. Al abrir el enlace o enviar el OTP, Supabase emite JWT (1 h) + refresh token rotatorio.
5. El cliente envía `Authorization: Bearer <JWT>` a la API.
6. Hono valida la firma con la **clave pública / JWKS** de Supabase (sin consultar la DB).
7. Las consultas a PostgreSQL aplican **RLS** según el rol del usuario.

## Salvaguardas

- Enlace válido **15 minutos**, un solo uso.
- OTP de 6 dígitos como alternativa (cambio de dispositivo, clientes de correo que consumen el enlace).
- Límite de **3 solicitudes por correo cada 15 minutos**.
- Dominio institucional con verificación reforzada para roles de edición.
- Sesión recordada **30 días** en dispositivos confiables.

## Roles

| Rol | Alcance |
|-----|---------|
| SuperAdmin | Sistema completo |
| Admin de centro | Su centro tutorial |
| Editor / Blogger | Contenido asignado |
| Docente | Recursos y perfil |
| Estudiante / Visitante | Lectura y participación limitada |

La autorización efectiva se implementa en **RLS** (PostgreSQL), no solo en la capa de aplicación.

## Implementación en la API (fases posteriores)

- Validación JWT con `jose` contra `SUPABASE_JWT_JWKS_URL`.
- Middleware Hono que extrae `sub`, rol y centro del token.
- Nunca confiar en `user_metadata` para decisiones de autorización.
- Service role key solo en workers; nunca en clientes ni en la API pública.

## Referencias

- [Visión general](./overview.md)
- [ADR 0001](../adr/0001-stack-backend.md)
