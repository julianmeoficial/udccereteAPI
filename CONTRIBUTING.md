# Guía de contribución

Gracias por contribuir al backend del Blog UDEC Cereté.

## Requisitos previos

- Node.js 24 LTS (`nvm use` con `.nvmrc`)
- pnpm 9 (`corepack enable`)
- Docker (recomendado para infra local)

## Flujo de trabajo

1. Crea una rama desde `main`: `feat/`, `fix/`, `docs/`, `chore/`.
2. Instala dependencias: `pnpm install`.
3. Realiza cambios siguiendo las convenciones del proyecto.
4. Si tocas contratos HTTP, arranque local o decisiones de stack, actualiza `docs/` en el mismo PR.
5. Abre un Pull Request con descripción clara y enlace a requerimiento si existe.

Antes del PR, en local:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

CI en GitHub aún es un marcador de posición. Ver [docs/operations/ci.md](docs/operations/ci.md).

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add posts list endpoint
fix(worker): retry newsletter on Resend timeout
docs: update auth flow diagram
chore(deps): bump hono to 4.7
```

## Documentación

La guía de cómo está organizado el árbol está en [docs/README.md](docs/README.md).

- **Referencia** (`docs/api/`): lo que el código hace hoy.
- **Explicación** (`docs/architecture/`, `docs/adr/`): por qué; marcar diseño vs implementado.
- **Operaciones** (`docs/operations/`): cómo correr y, más adelante, desplegar.
- Decisiones de stack o contrato transversal: ADR nuevo desde [docs/adr/template.md](docs/adr/template.md).
- No documentar trabajo futuro como si ya existiera.

## Reglas del proyecto

### API-first

- Los contratos Zod/OpenAPI se definen **antes** de implementar clientes.
- Ningún cliente (web, móvil) tiene endpoints exclusivos.
- Cambios que rompen compatibilidad abren `/api/v2`; `/api/v1` se congela al publicar.

### Seguridad

- **Nunca** commitear secretos, `.env` ni claves de servicio.
- Usar `.env.example` como referencia; valores reales solo en `.env` local o en el VPS.
- RLS es obligatorio en tablas expuestas; las políticas se probarán en CI cuando exista.
- No usar `user_metadata` del JWT para autorización; usar `app_metadata`.

### Código

- TypeScript estricto; sin `any` sin justificación.
- Imports de tipo con `import type`.
- Paquetes compartidos en `packages/`; lógica de app en `apps/`.
- ESLint + Prettier antes de cada PR (`pnpm lint`, `pnpm format:check`).

### Monorepo

- Dependencias internas vía `workspace:*`.
- Scripts en root con Turborepo: `pnpm dev`, `pnpm build`, `pnpm typecheck`.

### API y contratos

- Contratos Zod + OpenAPI viven en `packages/schemas` (`@udccerete/schemas`). Un esquema genera validación, tipos, Swagger y (más adelante) el SDK. No implementar endpoints nuevos sin el esquema correspondiente.
- La API REST pública se versiona por path: **`/api/v1`**. Cambios rompientes abren `/api/v2`; no se altera v1 publicada.
- Sobre transversal: éxito `{ data, meta }` y error `{ error: { code, message, details }, meta }`. `meta` siempre lleva `requestId` y `timestamp`. En listados, `pagination` va dentro de `meta`.
- Rate limit actual: en memoria, por proceso, solo en `/api/*`. En producción irá detrás de un gateway y/o Redis (`REDIS_URL`).
- CORS se configura con `CORS_ORIGIN` (lista separada por comas). El valor predeterminado de desarrollo permite localhost; no usar `*`.

Arranque y tabla de URLs: [docs/operations/local.md](docs/operations/local.md) y [docs/api/README.md](docs/api/README.md).

```bash
pnpm --filter @udccerete/api dev
```

## Estructura de PR

- **Qué** cambia y **por qué**.
- Enlace a spec Notion o issue si aplica.
- Docs actualizados si cambia el contrato o el arranque.
- Lista de verificación de pruebas manual (cuando haya endpoints).
- Sin secretos en diffs ni en comentarios.

## Reportar problemas

Incluir: entorno (OS, Node), pasos para reproducir, comportamiento esperado vs actual, logs relevantes (sin secretos).
