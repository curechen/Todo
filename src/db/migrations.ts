import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial',
    sql: `
      CREATE TABLE IF NOT EXISTS types (
        id TEXT PRIMARY KEY NOT NULL,
        parent_id TEXT REFERENCES types(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS types_parent_name_uq
        ON types(COALESCE(parent_id, ''), name);

      CREATE INDEX IF NOT EXISTS types_parent_sort_idx
        ON types(parent_id, sort_order);

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type_id TEXT NOT NULL REFERENCES types(id) ON DELETE CASCADE,
        priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 4),
        due_at INTEGER,
        detail TEXT NOT NULL DEFAULT '',
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS todos_pending_sort_idx
        ON todos(priority, updated_at DESC) WHERE completed_at IS NULL;

      CREATE INDEX IF NOT EXISTS todos_completed_idx
        ON todos(completed_at DESC) WHERE completed_at IS NOT NULL;

      CREATE INDEX IF NOT EXISTS todos_type_idx ON todos(type_id);

      CREATE INDEX IF NOT EXISTS todos_due_idx
        ON todos(due_at) WHERE completed_at IS NULL;

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
];

export async function runMigrations(database: SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
