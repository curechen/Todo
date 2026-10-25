import { newId } from '@/lib/ids';
import type { Priority } from '@/lib/priority';
import type { SortMode } from '@/lib/sort';
import { escapeLike } from '@/lib/sql';

import { getSqlite } from './client';
import { getTypeDescendantIds } from './type-repository';

export interface TodoFilters {
  typeId: string | null;
  keyword: string;
  priorities: Priority[];
  overdueOnly: boolean;
}

export interface TodoListItem {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  typeIcon: string;
  priority: Priority;
  dueAt: number | null;
  detail: string;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CompletedCursor {
  completedAt: number;
  id: string;
}

export interface CompletedPage {
  items: TodoListItem[];
  nextCursor: CompletedCursor | null;
}

export interface TodoInput {
  name: string;
  typeId: string;
  priority: Priority;
  dueAt: number | null;
  detail: string;
}

export interface TodoSnapshot {
  id: string;
  name: string;
  typeId: string;
  priority: Priority;
  dueAt: number | null;
  detail: string;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const TODO_SELECT = `
  SELECT
    t.id,
    t.name,
    t.type_id AS typeId,
    t.priority,
    t.due_at AS dueAt,
    t.detail,
    t.completed_at AS completedAt,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    ty.name AS typeName,
    ty.icon AS typeIcon
  FROM todos t
  JOIN types ty ON ty.id = t.type_id
`;

const SNAPSHOT_SELECT = `
  SELECT
    id,
    name,
    type_id AS typeId,
    priority,
    due_at AS dueAt,
    detail,
    completed_at AS completedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM todos
`;

function sortClause(sortMode: SortMode): string {
  switch (sortMode) {
    case 'priority_asc':
      return 't.priority DESC, t.updated_at DESC';
    case 'created_asc':
      return 't.created_at ASC, t.updated_at DESC';
    case 'created_desc':
      return 't.created_at DESC, t.updated_at DESC';
    case 'priority_desc':
    default:
      return 't.priority ASC, t.updated_at DESC';
  }
}

async function appendFilters(
  where: string[],
  params: Array<string | number>,
  filters: TodoFilters
): Promise<void> {
  if (filters.typeId) {
    const typeIds = await getTypeDescendantIds(filters.typeId);
    if (typeIds.length === 0) {
      where.push('1 = 0');
      return;
    }
    where.push(`t.type_id IN (${typeIds.map(() => '?').join(', ')})`);
    params.push(...typeIds);
  }

  if (filters.priorities.length > 0) {
    where.push(`t.priority IN (${filters.priorities.map(() => '?').join(', ')})`);
    params.push(...filters.priorities);
  }

  const keyword = filters.keyword.trim();
  if (keyword) {
    const pattern = `%${escapeLike(keyword)}%`;
    where.push("(t.name LIKE ? ESCAPE '\\' OR t.detail LIKE ? ESCAPE '\\')");
    params.push(pattern, pattern);
  }
}

export async function listPending(
  filters: TodoFilters,
  sortMode: SortMode
): Promise<TodoListItem[]> {
  const where = ['t.completed_at IS NULL'];
  const params: Array<string | number> = [];

  await appendFilters(where, params, filters);

  if (filters.overdueOnly) {
    where.push('t.due_at IS NOT NULL AND t.due_at < ?');
    params.push(Date.now());
  }

  return getSqlite().getAllAsync<TodoListItem>(
    `${TODO_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${sortClause(sortMode)};`,
    ...params
  );
}

export async function listCalendarTodos(
  rangeStart: number,
  rangeEnd: number
): Promise<TodoListItem[]> {
  return getSqlite().getAllAsync<TodoListItem>(
    `${TODO_SELECT}
     WHERE t.completed_at IS NULL
       AND t.due_at IS NOT NULL
       AND t.due_at >= ?
       AND t.due_at < ?
     ORDER BY t.due_at ASC, t.priority ASC;`,
    rangeStart,
    rangeEnd
  );
}

export async function listPendingWithDue(): Promise<TodoListItem[]> {
  return getSqlite().getAllAsync<TodoListItem>(
    `${TODO_SELECT}
     WHERE t.completed_at IS NULL
       AND t.due_at IS NOT NULL
     ORDER BY t.due_at ASC;`
  );
}

export async function listCompleted(
  filters: TodoFilters,
  cursor: CompletedCursor | null,
  limit = 30
): Promise<CompletedPage> {
  const where = ['t.completed_at IS NOT NULL'];
  const params: Array<string | number> = [];

  await appendFilters(where, params, filters);

  if (cursor) {
    where.push('(t.completed_at < ? OR (t.completed_at = ? AND t.id < ?))');
    params.push(cursor.completedAt, cursor.completedAt, cursor.id);
  }

  const items = await getSqlite().getAllAsync<TodoListItem>(
    `${TODO_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY t.completed_at DESC, t.id DESC
     LIMIT ?;`,
    ...params,
    limit
  );

  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last && last.completedAt != null
      ? { completedAt: last.completedAt, id: last.id }
      : null;

  return { items, nextCursor };
}

export async function getTodoById(id: string): Promise<TodoListItem | null> {
  return getSqlite().getFirstAsync<TodoListItem>(`${TODO_SELECT} WHERE t.id = ?;`, id);
}

export async function createTodo(input: TodoInput): Promise<string> {
  const id = newId();
  const now = Date.now();

  await getSqlite().runAsync(
    `INSERT INTO todos
       (id, name, type_id, priority, due_at, detail, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
    id,
    input.name,
    input.typeId,
    input.priority,
    input.dueAt,
    input.detail,
    now,
    now
  );

  return id;
}

export async function updateTodo(id: string, input: TodoInput): Promise<void> {
  await getSqlite().runAsync(
    `UPDATE todos
     SET name = ?, type_id = ?, priority = ?, due_at = ?, detail = ?, updated_at = ?
     WHERE id = ?;`,
    input.name,
    input.typeId,
    input.priority,
    input.dueAt,
    input.detail,
    Date.now(),
    id
  );
}

export async function completeTodo(id: string): Promise<void> {
  const now = Date.now();
  await getSqlite().runAsync(
    `UPDATE todos SET completed_at = ?, updated_at = ? WHERE id = ? AND completed_at IS NULL;`,
    now,
    now,
    id
  );
}

export async function uncompleteTodo(id: string): Promise<void> {
  await getSqlite().runAsync(
    `UPDATE todos SET completed_at = NULL, updated_at = ? WHERE id = ?;`,
    Date.now(),
    id
  );
}

async function getSnapshots(ids: string[]): Promise<TodoSnapshot[]> {
  if (ids.length === 0) return [];
  return getSqlite().getAllAsync<TodoSnapshot>(
    `${SNAPSHOT_SELECT} WHERE id IN (${ids.map(() => '?').join(', ')});`,
    ...ids
  );
}

export async function deleteTodos(ids: string[]): Promise<TodoSnapshot[]> {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];

  const snapshots = await getSnapshots(uniqueIds);

  await getSqlite().withTransactionAsync(async () => {
    await getSqlite().runAsync(
      `DELETE FROM todos WHERE id IN (${uniqueIds.map(() => '?').join(', ')});`,
      ...uniqueIds
    );
  });

  return snapshots;
}

export async function restoreTodos(snapshots: TodoSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return;

  await getSqlite().withTransactionAsync(async () => {
    for (const snapshot of snapshots) {
      await getSqlite().runAsync(
        `INSERT OR REPLACE INTO todos
           (id, name, type_id, priority, due_at, detail, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        snapshot.id,
        snapshot.name,
        snapshot.typeId,
        snapshot.priority,
        snapshot.dueAt,
        snapshot.detail,
        snapshot.completedAt,
        snapshot.createdAt,
        snapshot.updatedAt
      );
    }
  });
}
