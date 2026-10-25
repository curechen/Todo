import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME } from '@/lib/app';
import * as schema from './schema';

let database: SQLiteDatabase | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getSqlite(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync(DATABASE_NAME);
  }
  return database;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlite(), { schema });
  }
  return dbInstance;
}

export function configureDatabase(target: SQLiteDatabase): void {
  target.execSync('PRAGMA journal_mode = WAL;');
  target.execSync('PRAGMA foreign_keys = ON;');
}
