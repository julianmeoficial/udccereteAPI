# Stub — Dockerfile de la API para despliegue en VPS.
# Las etapas de build se implementarán cuando exista el servidor Hono.

FROM node:24-alpine AS base
WORKDIR /app

# Etapas de dependencias, build y runtime se añadirán en fases posteriores.

CMD ["node", "--version"]
