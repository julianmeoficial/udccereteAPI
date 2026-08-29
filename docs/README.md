# Documentación

Fuente de verdad **en el repositorio** del backend API UDEC Cereté. La spec de producto en Notion complementa este árbol; si hay conflicto, el código y estos archivos mandan sobre el estado de implementación.

**Actualizado:** 2026-08-28

## Cómo está organizada

Sigue [Diátaxis](https://diataxis.fr/): cada documento tiene un propósito. No mezclar tutorial, referencia y diseño en el mismo archivo.

| Carpeta | Tipo | Para qué |
|---------|------|----------|
| [architecture/](architecture/overview.md) | Explicación | Por qué el sistema es así |
| [adr/](adr/README.md) | Explicación / decisión | Decisiones que no se reabren en cada PR |
| [api/](api/README.md) | Referencia | Contrato HTTP, errores, versionado |
| [operations/](operations/README.md) | Tutorial / guía | Levantar, CI, despliegue |

En la raíz del repo: [README.md](../README.md) (entrada), [CONTRIBUTING.md](../CONTRIBUTING.md) (cómo contribuir), [CHANGELOG.md](../CHANGELOG.md) (historial).

## Mapa

### Arquitectura

| Documento | Contenido |
|-----------|-----------|
| [Visión general](architecture/overview.md) | Principios, componentes, qué está implementado |
| [Diagramas de flujo](architecture/diagrams.md) | Mermaid: cliente-servidor, datos, acceso, roadmap |
| [Autenticación](architecture/auth.md) | JWT Supabase + matriz de permisos |
| [Modelo de datos](architecture/data-model.md) | Entidades Drizzle, RLS, retención |
| [Trabajo asíncrono](architecture/async.md) | Redis, BullMQ, workers |

### API (referencia)

| Documento | Contenido |
|-----------|-----------|
| [Superficie actual](api/README.md) | Endpoints, headers, CORS, límite de peticiones |
| [Versionado](api/versioning.md) | `/api/v1`, OpenAPI, tRPC/webhooks (planificados) |
| [Errores](api/errors.md) | Sobre `{ error, meta }`, catálogo de códigos |

### Operaciones

| Documento | Contenido |
|-----------|-----------|
| [Desarrollo local](operations/local.md) | Node, pnpm, Docker, migraciones, arranque |
| [Conectar Supabase](operations/supabase.md) | Guía para el entorno cloud |
| [CI](operations/ci.md) | GitHub Actions (marcador de posición) |
| [Despliegue](operations/deploy.md) | Plan VPS; Docker + Caddy |

### Decisiones (ADR)

| Documento | Contenido |
|-----------|-----------|
| [Índice y proceso](adr/README.md) | Cuándo escribir un ADR y estados |
| [Plantilla](adr/template.md) | Esqueleto para ADR nuevos |
| [ADR 0001](adr/0001-stack-backend.md) | Stack backend cerrado |

## Convención de estado

Cada documento indica qué es **vigente en código** y qué es **diseño pendiente**. No documentar el futuro como si ya existiera.

| Etiqueta | Significado |
|----------|-------------|
| Implementado | Se puede ejecutar o importar hoy |
| Parcial | Hay estructura o dependencias, falta el comportamiento |
| Diseño | Decisión de producto/arquitectura; no hay código de runtime |

Al cambiar contratos o el arranque local, actualizar **el mismo PR** la referencia en `docs/api/` o `docs/operations/`. Las decisiones de stack van a un ADR, no a un comentario suelto.

## Fuera de este árbol

- Contratos Zod: `packages/schemas` (el OpenAPI en `/doc` se genera desde ahí y desde las rutas Hono).
- Spec de producto: [API UDEC Cereté en Notion](https://app.notion.com/p/3c68b2d8659c809fa107d5347729b850).
