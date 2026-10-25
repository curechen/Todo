import { getSqlite } from './client';

export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const database = getSqlite();
  const row = await database.getFirstAsync<DashboardStats>(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN completed_at IS NULL THEN 1 ELSE 0 END), 0) AS pending,
      COALESCE(SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS completed
    FROM todos;
  `);

  return row ?? { total: 0, pending: 0, completed: 0 };
}

export async function getTypeCount(): Promise<number> {
  const database = getSqlite();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM types;');
  return row?.count ?? 0;
}
