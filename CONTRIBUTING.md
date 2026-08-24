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
4. Abre un Pull Request con descripción clara y enlace a requerimiento si existe.

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add posts list endpoint
fix(worker): retry newsletter on Resend timeout
docs: update auth flow diagram
chore(deps): bump hono to 4.7
```

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

## Estructura de PR

- **Qué** cambia y **por qué**.
- Enlace a spec Notion o issue si aplica.
- Checklist de pruebas manual (cuando haya endpoints).
- Sin secretos en diffs ni en comentarios.

## Reportar problemas

Incluir: entorno (OS, Node), pasos para reproducir, comportamiento esperado vs actual, logs relevantes (sin secretos).
