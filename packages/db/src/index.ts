import { sql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { allTables, type Schema } from './schema/index.js';

export * from './schema/index.js';

export type Database = PostgresJsDatabase<Schema>;

let client: postgres.Sql | null = null;
let db: Database | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL no está configurada');
  }
  if (!db) {
    client = postgres(url, { max: 10, prepare: false });
    db = drizzle(client, { schema: allTables });
  }
  return db;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const database = getDb();
    await database.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}
