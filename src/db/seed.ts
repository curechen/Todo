import type { SQLiteDatabase } from 'expo-sqlite';

interface PresetType {
  id: string;
  parentId: string | null;
  name: string;
  icon: string;
  sortOrder: number;
}

const PRESET_TYPES: PresetType[] = [
  { id: 'preset-company', parentId: null, name: '公司', icon: 'briefcase', sortOrder: 0 },
  { id: 'preset-self', parentId: null, name: '自我提升', icon: 'sparkles', sortOrder: 1 },
  { id: 'preset-reading', parentId: 'preset-self', name: '阅读', icon: 'book-open', sortOrder: 0 },
  { id: 'preset-fitness', parentId: 'preset-self', name: '健身', icon: 'dumbbell', sortOrder: 1 },
];

const DEFAULT_SETTINGS: Array<[string, string]> = [
  ['reminders_enabled', 'true'],
  ['daily_summary_time', '10:00'],
  ['sort_mode', 'priority_desc'],
  ['notification_prompted', 'false'],
  ['seeded', 'false'],
];

export async function seedDatabase(database: SQLiteDatabase): Promise<void> {
  await database.withTransactionAsync(async () => {
    for (const [key, value] of DEFAULT_SETTINGS) {
      await database.runAsync(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);',
        key,
        value
      );
    }

    const seeded = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'seeded';"
    );
    if (seeded?.value === 'true') return;

    const now = Date.now();

    for (const preset of PRESET_TYPES) {
      await database.runAsync(
        `INSERT OR IGNORE INTO types
           (id, parent_id, name, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        preset.id,
        preset.parentId,
        preset.name,
        preset.icon,
        preset.sortOrder,
        now,
        now
      );
    }

    await database.runAsync("UPDATE settings SET value = 'true' WHERE key = 'seeded';");
  });
}
