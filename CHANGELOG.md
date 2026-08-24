# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Estructura inicial del monorepo (apps, packages, docs, docker).
- Documentación de arquitectura, API, operaciones y ADR 0001.
- Dependencias del stack cerrado (Hono, Drizzle, BullMQ, etc.).
- `docker-compose.yml` con Postgres 17, Redis y Typesense para desarrollo local.
- `.env.example` con variables de entorno documentadas.
- Contratos Zod + OpenAPI en `@udccerete/schemas` (`packages/schemas`): error, paginación, params, roles, archivos y respuestas estándar.
- API Hono inicial (`@udccerete/api`): `GET /health`, `GET /api/v1/health`, `GET /api/v1/meta`, middlewares (request id, CORS, logger, rate limit en memoria, errores) y Swagger UI en `/ui` (spec en `/doc`).
- Variables `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX` en `.env.example`.

## [0.0.0] - 2026-08-24

Versión inicial de scaffolding. Sin API desplegable.

[Unreleased]: https://github.com/udccerete/udccereteAPI/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/udccerete/udccereteAPI/releases/tag/v0.0.0
