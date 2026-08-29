# Desarrollo local

**Estado:** vigente · **Actualizado:** 2026-08-28

## Requisitos

- Node.js **24** (`.nvmrc`; `nvm use`)
- pnpm **9** (`corepack enable`)
- Docker (Postgres, Redis, Typesense)

## Configuración

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter @udccerete/db build
DATABASE_URL=postgresql://udccerete:udccerete@localhost:5432/udccerete pnpm --filter @udccerete/db db:migrate
```

## Arrancar

```bash
# Terminal 1 — API
pnpm --filter @udccerete/api dev

# Terminal 2 — Workers (opcional, requiere Redis)
pnpm --filter @udccerete/worker dev
```

| Recurso | URL |
|---------|-----|
| Salud | `GET /health`, `GET /api/v1/health` |
| Swagger | `GET /ui` |
| RSS | `GET /feed.xml` |

## Auth en desarrollo

Sin `SUPABASE_JWT_JWKS_URL`, la API acepta JWT sin verificar firma (solo si `NODE_ENV !== production`). Genera un JWT de prueba con este payload:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "estudiante@unicartagena.edu.co",
  "app_metadata": { "role": "student" }
}
```

Codifica `header.payload.signature` en base64url para pruebas con:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/v1/me
```

## Scripts

```bash
pnpm typecheck
pnpm test          # Vitest (esquemas + permisos)
pnpm build
pnpm --filter @udccerete/db db:studio
```

## Siguiente paso

[Conectar Supabase](./supabase.md)
