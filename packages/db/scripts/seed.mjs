import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const seedsDir = join(dirname(fileURLToPath(import.meta.url)), '../seeds');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatorio para db:seed');
  }

  const onlyCatalog = process.argv.includes('--catalog-only');
  const sql = postgres(databaseUrl, { max: 1 });

  const files = readdirSync(seedsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .filter((file) => (onlyCatalog ? file.startsWith('001_') : true));

  for (const file of files) {
    const statement = readFileSync(join(seedsDir, file), 'utf8');
    console.log(`Aplicando seed ${file}...`);
    await sql.unsafe(statement);
  }

  await sql.end();
  console.log('Seed completado.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
