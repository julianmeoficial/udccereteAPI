# Registros de decisiones de arquitectura (ADR)

Los ADR capturan **decisiones de arquitectura o de stack que son costosas de revertir**. No sustituyen issues ni PRs: dejan el «por qué» junto al código.

**Actualizado:** 2026-08-28

## Índice

| ADR | Título | Estado | Fecha |
|-----|--------|--------|-------|
| [0001](0001-stack-backend.md) | Stack backend cerrado | Aceptado | 2026-08-24 |

## Cuándo escribir uno

Escribe un ADR si el cambio:

- elige o descarta un runtime, framework, base de datos o proveedor;
- congela un contrato público (p. ej. el sobre JSON o `/api/v1`);
- impone una restricción operativa (la API no vive en Vercel, RLS obligatorio, etc.).

No hace falta ADR para un endpoint nuevo, un refactor local o un bump de parche.

## Cómo contribuir

1. Copia [template.md](template.md) a `NNNN-titulo-en-kebab.md` (siguiente número de 4 dígitos).
2. Estado inicial: **Propuesto**.
3. Enlázalo desde esta tabla.
4. Al aceptarse, pasa a **Aceptado** y referencia el PR.

Estados posibles: `Propuesto` · `Aceptado` · `Deprecado` · `Reemplazado por ADR NNNN`.

## Formato

El proyecto usa un MADR breve en español: contexto, decisión, alternativas y consecuencias. Ver la [plantilla](template.md).
