# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Esquema Drizzle completo (27 tablas, RD-001–RD-011), migración `0000_*`, SQL RLS/triggers para Supabase.
- Contratos Zod por módulo: auth, posts, comments, calendar, events, resources, forum, notifications, wellbeing, citations, admin, search, ai.
- Middleware JWT (`jose` + JWKS), permisos por rol, rutas `/api/v1` Must+Should.
- Workers BullMQ, colas, adaptadores R2/Typesense/Resend/VAPID con degradación sin env.
- RSS `GET /feed.xml`, health readiness con checks DB/Redis.
- Docs: `data-model.md`, `operations/supabase.md`, catálogo de endpoints actualizado.
- Vitest: pruebas de esquemas Zod y matriz de permisos.

### Changed

- API pasa de scaffolding a dominio v1 listo para conectar Supabase.
- Documentación de arquitectura, auth, async y operaciones actualizada al estado implementado.

## [0.0.0] - 2026-08-24

Versión inicial de scaffolding. Sin API desplegable.

[Unreleased]: https://github.com/udccerete/udccereteAPI/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/udccerete/udccereteAPI/releases/tag/v0.0.0
