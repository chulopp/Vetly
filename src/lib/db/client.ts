import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL is not set — offers cannot be saved until the database is configured.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
}

let cached: NeonHttpDatabase<typeof schema> | null = null;

/** Lazy, cached neon-http Drizzle client — serverless HTTP, effectively instant cold start. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  if (!cached) {
    cached = drizzle({ client: neon(url), schema });
  }
  return cached;
}
