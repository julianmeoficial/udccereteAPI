# Diagramas de flujo

Vista **de muy alto nivel** del backend API UDEC Cereté: qué puede hacer hoy la API, cómo interactúan clientes y servicios, y qué queda por conectar.

**Actualizado:** 2026-08-28

> **Leyenda:** líneas y nodos **continuos** = implementado en código. Líneas **punteadas** = diseño acordado o parcial (falta credencial, deploy o integración cloud).

---

## 1. Contexto del sistema

Cuatro clientes (repos aparte) consumen un único contrato REST `/api/v1`. La API no sirve HTML estático ni archivos grandes en el cuerpo de la respuesta.

```mermaid
flowchart TB
  subgraph clientes["Clientes (fuera de este repo)"]
    WEB["Web pública<br/>(Next.js)"]
    EXPO["Expo iOS / Android"]
    HUAWEI["App HUAWEI<br/>(ArkTS / HMS)"]
    TERCEROS["Integraciones<br/>terceras"]
  end

  subgraph vps["VPS Hetzner (producción, diseño)"]
    API["@udccerete/api<br/>Hono 4 · REST /api/v1"]
    WORKER["@udccerete/worker<br/>BullMQ"]
    REDIS[("Redis")]
    TYPESENSE[("Typesense")]
  end

  subgraph cloud["Servicios cloud"]
    SUPA[("Supabase<br/>PostgreSQL 17 + Auth")]
    R2[("Cloudflare R2<br/>archivos")]
    CF["Cloudflare<br/>DNS · WAF · CDN"]
    RESEND["Resend<br/>correo transaccional"]
  end

  subgraph externos["APIs externas"]
    CROSSREF["Crossref / OpenAlex<br/>(citas)"]
    IA["Perplexity Sonar<br/>(fase posterior)"]
  end

  WEB & EXPO & HUAWEI & TERCEROS -->|HTTPS JSON| CF
  CF --> API

  API -->|Drizzle ORM| SUPA
  API -->|encola jobs| REDIS
  API -.->|URL prefirmada| R2
  API -.->|búsqueda| TYPESENSE
  API -->|proxy citas| CROSSREF
  API -.->|503 reservado| IA

  REDIS --> WORKER
  WORKER --> TYPESENSE
  WORKER --> RESEND
  WORKER --> SUPA

  SUPA -.->|Magic Link SMTP| RESEND
```

---

## 2. Cliente ↔ servidor (petición REST típica)

Toda respuesta JSON sigue el sobre `{ data, meta }` o `{ error, meta }`. Excepciones: `/feed.xml` y `/api/v1/calendar.ics`.

```mermaid
sequenceDiagram
  autonumber
  participant C as Cliente
  participant API as API Hono
  participant Z as Zod / OpenAPI
  participant J as Middleware JWT
  participant P as Permisos
  participant S as Servicio
  participant DB as PostgreSQL

  C->>API: HTTP (Authorization opcional)
  API->>API: CORS + x-request-id + límite peticiones
  API->>Z: Validar query / body / params

  alt Ruta protegida
    API->>J: Verificar JWT (jose + JWKS)
    J->>P: Rol desde app_metadata
    P-->>API: Permitir / 403
  end

  API->>S: Lógica de dominio
  S->>DB: Consulta Drizzle
  DB-->>S: Filas (RLS cuando esté activo)
  S-->>API: Resultado o error de negocio
  API-->>C: 200 { data, meta } o 4xx/5xx { error, meta }
```

---

## 3. Acceso e identidad (Magic Link, Google OAuth + JWT)

La API expone proxy `/api/v1/auth/*` y también acepta tokens obtenidos directamente con `@supabase/supabase-js`. Supabase Auth emite el token; la API **valida la firma** (JWKS) y aplica permisos. RLS en PostgreSQL cuando está aplicado en cloud.

```mermaid
sequenceDiagram
  autonumber
  participant U as Usuario
  participant C as Cliente
  participant API as API Hono
  participant SA as Supabase Auth
  participant R as Resend

  alt Magic Link
    U->>C: Email cualquier dominio
    C->>API: POST /auth/magic-link
    API->>SA: signInWithOtp
    SA->>R: Enlace + OTP
    R->>U: Correo
    U->>SA: Abrir enlace o OTP
  else Google OAuth
    C->>API: POST /auth/google
    API-->>C: url autorización
    C->>SA: Callback Google
    C->>API: POST /auth/session
    API->>SA: exchangeCodeForSession
  end

  SA-->>C: JWT + refresh
  C->>API: Authorization Bearer JWT
  API->>API: Validar JWKS
  Note over API: trigger crea profile student o visitor
```

---

## 4. Capas de autorización

Doble barrera: permisos en la API y políticas en la base.

```mermaid
flowchart LR
  JWT["JWT Supabase<br/>app_metadata.role"]
  MW["Middleware Hono<br/>jose + JWKS"]
  MAT["Matriz permisos<br/>permissions.ts"]
  SVC["Servicios / rutas"]
  RLS["RLS PostgreSQL<br/>rls.sql"]
  TBL[("Tablas<br/>profiles, posts, …")]

  JWT --> MW --> MAT --> SVC --> RLS --> TBL
```

| Rol | Alcance (alto nivel) |
|-----|---------------------|
| `visitor` | Lectura pública |
| `student` | Lectura + participación institucional |
| `teacher` | Recursos y perfil docente |
| `editor` | Contenido asignado |
| `admin` | Su centro tutorial |
| `super_admin` | Sistema completo |

Detalle: [Autenticación](./auth.md).

---

## 5. Flujos de datos por dominio

Qué puede hacer la API **hoy**, agrupado por nivel de acceso. Las capas se leen **de arriba abajo** (de menor a mayor privilegio); todas convergen en la misma API.

```mermaid
flowchart TD
  subgraph acceso["Dominios por nivel de acceso"]
    direction TB

    P["① Público — sin JWT<br/><br/>Blog · categorías · etiquetas · RSS<br/>Calendario · exportación iCal<br/>Foro · bienestar · búsqueda<br/>Citas académicas (Crossref)"]

    J["② Autenticado — JWT<br/><br/>Perfil /me · guardados · lecturas<br/>Comentarios institucionales<br/>Inscripción a eventos<br/>Opiniones de foro (anónimas en DB)<br/>Notificaciones y Web Push"]

    E["③ Editorial — editor+ / docente<br/><br/>CRUD de posts · archivar<br/>CRUD de calendario · importación CSV<br/>CRUD de eventos<br/>Recursos académicos + URL R2<br/>Moderación de comentarios y foro"]

    A["④ Administración — admin / super_admin<br/><br/>Usuarios y asignación de roles<br/>Auditoría · analítica"]

    P --- J
    J --- E
    E --- A
  end

  acceso ==> API["API Hono<br/>REST /api/v1"]

  subgraph persistencia["Persistencia"]
    direction TB
    PG[("PostgreSQL<br/>datos principales")]
    TS[("Typesense<br/>búsqueda")]
    R2[("Cloudflare R2<br/>archivos")]
  end

  API ==> PG
  API -.-> TS
  API -.-> R2
```

Las líneas entre capas (`---`) solo ordenan la lectura; no implican un flujo secuencial. Las líneas punteadas hacia Typesense y R2 indican integraciones opcionales (degradación sin credenciales).

Catálogo completo: [Referencia de la API](../api/README.md).

---

## 6. Búsqueda y degradación

Si Typesense no está disponible, la API intenta una alternativa SQL y avisa al cliente.

```mermaid
flowchart TD
  REQ["GET /api/v1/search?q=…"]
  REQ --> TRY{Typesense<br/>disponible?}
  TRY -->|Sí| TS["Consulta índice"]
  TRY -->|No| SQL["Consulta SQL alternativa"]
  TS --> OK["200 { data, meta }"]
  SQL --> DEG["200 + aviso de degradación"]
  TRY -->|Error grave| S503["503 SERVICE_DEGRADED"]

  EDIT["POST/PATCH post"] -.->|job| Q["search.reindex"]
  Q --> W["Worker"]
  W --> TS
```

---

## 7. Archivos (recursos académicos)

Los binarios no pasan por el cuerpo de la API; solo metadatos y URLs prefirmadas.

```mermaid
sequenceDiagram
  participant C as Cliente docente
  participant API as API Hono
  participant DB as PostgreSQL
  participant R2 as Cloudflare R2

  C->>API: POST /resources (metadatos)
  API->>DB: INSERT resource
  API-->>C: URL prefirmada de subida
  C->>R2: PUT archivo (directo)
  C->>API: GET /resources/:id/download
  API->>DB: Verificar alcance RN-005
  API-->>C: URL prefirmada de descarga
```

---

## 8. Trabajo asíncrono (colas)

La API encola y responde rápido; el worker procesa en segundo plano. Sin `REDIS_URL`, la cola es no-op (solo log en desarrollo).

```mermaid
flowchart LR
  API["API Hono"] -->|addJob| REDIS[("Redis / BullMQ")]
  CRON["Tareas programadas<br/>(futuro)"] -.-> REDIS
  REDIS --> W["Worker"]
  W --> TS["Typesense<br/>search.reindex"]
  W --> EM["Resend<br/>notify.* · mail.digest"]
  W --> DB["PostgreSQL<br/>user.purge"]
  W -.-> PUSH["Push móvil<br/>(FCM · APNs · HMS)"]
```

Colas implementadas: [Trabajo asíncrono](./async.md).

---

## 9. Monorepo y contratos

Un esquema Zod alimenta validación, tipos TypeScript y OpenAPI en `/doc`.

```mermaid
flowchart TB
  subgraph apps["apps/"]
    API3["api — rutas Hono"]
    WRK["worker — procesadores"]
    CMS["cms — reservado Payload"]
  end

  subgraph packages["packages/"]
    SCH["schemas — Zod + OpenAPI"]
    DB3["db — Drizzle + migraciones + RLS SQL"]
    TSC["tsconfig"]
  end

  SCH --> API3
  SCH --> WRK
  DB3 --> API3
  DB3 --> WRK
  API3 -->|genera| OAS["GET /doc · GET /ui"]
```

---

## 10. Mapa implementado vs pendiente

Estado al **2026-08-31** según el código en `main`.

```mermaid
flowchart TB
  subgraph hecho["✅ Implementado"]
    H1["REST /api/v1 completo"]
    H2["JWT + permisos + proxy auth"]
    H3["Esquemas Drizzle + migraciones 0000/0001"]
    H4["Contratos Zod por módulo"]
    H5["OpenAPI / Swagger"]
    H6["Workers BullMQ + adaptadores"]
    H7["RSS · iCal · citas proxy"]
    H8["Degradación sin env"]
    H9["Seed catálogo + blog local"]
  end

  subgraph parcial["🟡 Parcial / sin credenciales"]
    P8["RLS + triggers en Supabase cloud"]
    P9["Typesense · R2 · Resend SMTP en prod"]
    P10["Redis en prod"]
    P11["Límite peticiones en memoria"]
  end

  subgraph pendiente["⬜ Pendiente / reservado"]
    F1[".env cloud + primera migración aplicada"]
    F2["Deploy VPS + Caddy + CI real"]
    F3["Payload CMS"]
    F4["tRPC interno web"]
    F5["POST /ai/ask (Perplexity)"]
    F6["Webhooks firmados"]
    F7["Push móvil nativo"]
    F8["SDK cliente generado"]
  end

  hecho --> parcial
  parcial --> pendiente
```

| Próximo paso operativo | Documento |
|------------------------|-----------|
| Completar `.env` y migrar schema | [Migraciones a Supabase](../operations/migrations-supabase.md) |
| Configurar Auth + Google | [Conectar Supabase](../operations/supabase.md) |
| Arrancar en local | [Desarrollo local](../operations/local.md) |
| Plan de producción | [Despliegue](../operations/deploy.md) |

---

## 11. Entorno local vs producción (objetivo)

Hoy el desarrollo usa Docker Compose para Postgres, Redis y Typesense. Producción reparte roles entre VPS y cloud.

```mermaid
flowchart LR
  subgraph local["Desarrollo local (hoy)"]
    LAPI["pnpm api dev :3001"]
    LWRK["pnpm worker dev"]
    LPG[("Postgres<br/>Compose")]
    LR[("Redis<br/>Compose")]
    LT[("Typesense<br/>Compose")]
    LAPI --> LPG & LR & LT
    LWRK --> LR
  end

  subgraph prod["Producción (diseño ADR 0001)"]
    PAPI["API + Worker<br/>Docker VPS"]
    PSUPA[("Supabase")]
    PR2[("R2")]
    PCF["Cloudflare"]
    PAPI --> PSUPA & PR2
    PCF --> PAPI
  end

  local -.->|migrar credenciales| prod
```

---

## Referencias

- [Visión general](./overview.md)
- [Autenticación](./auth.md)
- [Modelo de datos](./data-model.md)
- [Trabajo asíncrono](./async.md)
- [Referencia de la API](../api/README.md)
- [ADR 0001 — Stack backend](../adr/0001-stack-backend.md)
