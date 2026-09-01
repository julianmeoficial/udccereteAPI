# Primeras migraciones Drizzle → Supabase

**Estado:** vigente · **Actualizado:** 2026-08-31

Este repositorio usa **Drizzle ORM**, no Prisma (ver [ADR 0001](../adr/0001-stack-backend.md)). Las migraciones viven en `packages/db/drizzle/`.

## Prerrequisitos

1. Proyecto Supabase creado (PostgreSQL 17).
2. `.env` con `DATABASE_URL` del **pooler** en modo `transaction` (puerto `6543`).
3. Variables de auth documentadas en [env.md](./env.md).

## Orden de aplicación (primera vez)

Ejecutar **en este orden**. No saltar pasos.

```mermaid
flowchart LR
  A["0000 migración Drizzle"] --> B["0001 índices blog"]
  B --> C["triggers.sql"]
  C --> D["rls.sql"]
  D --> E["seed catálogo"]
```

### 1. Migraciones Drizzle

```bash
pnpm install
pnpm --filter @udccerete/db build
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  pnpm --filter @udccerete/db db:migrate
```

Archivos aplicados:

| Archivo | Contenido |
|---------|-----------|
| `packages/db/drizzle/0000_soft_captain_marvel.sql` | Schema completo (27 tablas) |
| `packages/db/drizzle/0001_blog_indexes.sql` | Índices de posts, comments, post_tags |

### 2. Triggers de Auth

En el **SQL Editor** de Supabase, ejecutar:

[`packages/db/supabase/triggers.sql`](../../packages/db/supabase/triggers.sql)

Crea `handle_new_user()` que inserta en `profiles` al registrar usuario:

- Email `@unicartagena.edu.co` → rol default `student`
- Otros dominios → rol default `visitor`
- `app_metadata.role` en el JWT **sobrescribe** el default (para staff)

### 3. Row Level Security

Ejecutar:

[`packages/db/supabase/rls.sql`](../../packages/db/supabase/rls.sql)

Políticas basadas en `auth.jwt() -> app_metadata`.

### 4. Seed de catálogo (opcional)

Solo datos de referencia (centros, categorías, tags, bienestar). **No** incluye perfiles de prueba (esos los crea el trigger al primer login).

```bash
DATABASE_URL="..." pnpm --filter @udccerete/db db:seed:catalog
```

Para desarrollo local con posts/comentarios de prueba, usar el seed completo (ver [local.md](./local.md)).

## Verificación

```bash
pnpm --filter @udccerete/api dev
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/doc
```

Con JWT válido:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/me
```

## Qué no hacer

| Error común | Por qué |
|-------------|---------|
| Mezclar seed en migraciones Drizzle | Las migraciones son solo schema; el seed es idempotente y aparte |
| Usar `service_role` en el cliente | Bypass de RLS; solo server-side |
| Aplicar RLS antes del schema | Fallan las políticas por tablas inexistentes |
| Conectar directo al puerto 5432 en serverless | Usar pooler `6543` en modo transaction |
| Autorizar con `user_metadata` | Solo `app_metadata.role` es confiable |

## Migraciones incrementales (después de la primera)

```bash
# Tras cambiar schema en packages/db/src/schema/
pnpm --filter @udccerete/db db:generate   # genera nuevo SQL
pnpm --filter @udccerete/db db:migrate    # aplica contra DATABASE_URL
```

Los archivos `triggers.sql` y `rls.sql` solo se re-ejecutan si cambian (usar `CREATE OR REPLACE` / `DROP POLICY IF EXISTS` según el diff).

## Referencias

- [Conectar Supabase](./supabase.md)
- [Variables de entorno](./env.md)
- [Modelo de datos](../architecture/data-model.md)
