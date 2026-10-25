import { getSqlite } from './client';

export async function getSetting(key: string): Promise<string | null> {
  const row = await getSqlite().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getSqlite().runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
    key,
    value
  );
}
