import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // drizzle-kit no resuelve imports .js desde TS; usar salida compilada.
  schema: './dist/schema/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
