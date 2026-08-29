# Integración continua

**Estado:** marcador de posición · **Actualizado:** 2026-08-28

El workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) se dispara en `push` y `pull_request` a `main`. El job actual solo imprime un mensaje: lint, typecheck, tests y migraciones **no corren en Actions**.

En local, antes de abrir un PR:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

Cuando se active CI real, el plan es: `pnpm lint`, `pnpm typecheck`, `pnpm build` y, más adelante, pruebas de RLS. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Referencias

- [Desarrollo local](local.md)
- [Despliegue](deploy.md)
