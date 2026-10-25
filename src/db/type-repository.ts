import { newId } from '@/lib/ids';

import { getSqlite } from './client';
import type { TypeRow } from './schema';
import type { TodoSnapshot } from './todo-repository';

const TYPE_COLUMNS = `
  id,
  parent_id AS parentId,
  name,
  icon,
  sort_order AS sortOrder,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const TODO_SNAPSHOT_COLUMNS = `
  id,
  name,
  type_id AS typeId,
  priority,
  due_at AS dueAt,
  detail,
  completed_at AS completedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export type TypeSnapshot = TypeRow;

export interface TypeInput {
  name: string;
  icon: string;
  parentId: string | null;
}

export interface TypeDeleteInfo {
  typeIds: string[];
  childCount: number;
  todoCount: number;
}

export interface TypeSubtreeSnapshot {
  typeIds: string[];
  types: TypeSnapshot[];
  todos: TodoSnapshot[];
}

export interface RestoreTypeResult {
  renamed: boolean;
}

export class TypeNameConflictError extends Error {
  constructor() {
    super('同一父层级下已存在同名类型');
    this.name = 'TypeNameConflictError';
  }
}

export class TypeParentError extends Error {
  constructor() {
    super('不能把类型移动到自身或其子类型下');
    this.name = 'TypeParentError';
  }
}

export async function listTypes(): Promise<TypeRow[]> {
  return getSqlite().getAllAsync<TypeRow>(
    `SELECT ${TYPE_COLUMNS} FROM types ORDER BY sort_order ASC, created_at ASC;`
  );
}

export async function getTypeById(typeId: string): Promise<TypeRow | null> {
  return getSqlite().getFirstAsync<TypeRow>(
    `SELECT ${TYPE_COLUMNS} FROM types WHERE id = ?;`,
    typeId
  );
}

export async function getTypeDescendantIds(typeId: string): Promise<string[]> {
  const rows = await getSqlite().getAllAsync<{ id: string }>(
    `WITH RECURSIVE subtree(id) AS (
       SELECT id FROM types WHERE id = ?
       UNION ALL
       SELECT t.id FROM types t JOIN subtree s ON t.parent_id = s.id
     )
     SELECT id FROM subtree;`,
    typeId
  );

  return rows.map((row) => row.id);
}

async function isTypeNameTaken(
  parentId: string | null,
  name: string,
  excludeId?: string
): Promise<boolean> {
  const row = await getSqlite().getFirstAsync<{ found: number }>(
    `SELECT 1 AS found FROM types
     WHERE COALESCE(parent_id, '') = COALESCE(?, '')
       AND name = ?
       AND id != ?
     LIMIT 1;`,
    parentId,
    name,
    excludeId ?? ''
  );

  return row != null;
}

async function getNextSortOrder(parentId: string | null): Promise<number> {
  const row = await getSqlite().getFirstAsync<{ nextSortOrder: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextSortOrder
     FROM types
     WHERE COALESCE(parent_id, '') = COALESCE(?, '');`,
    parentId
  );

  return row?.nextSortOrder ?? 0;
}

export async function createType(input: TypeInput): Promise<string> {
  const name = input.name.trim();

  if (await isTypeNameTaken(input.parentId, name)) {
    throw new TypeNameConflictError();
  }

  const sortOrder = await getNextSortOrder(input.parentId);
  const id = newId();
  const now = Date.now();

  await getSqlite().runAsync(
    `INSERT INTO types (id, parent_id, name, icon, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.parentId,
    name,
    input.icon,
    sortOrder,
    now,
    now
  );

  return id;
}

export async function updateType(typeId: string, input: TypeInput): Promise<void> {
  const current = await getTypeById(typeId);
  if (!current) throw new Error('类型不存在');

  const name = input.name.trim();

  if (input.parentId !== null) {
    if (input.parentId === typeId) throw new TypeParentError();

    const descendants = await getTypeDescendantIds(typeId);
    if (descendants.includes(input.parentId)) throw new TypeParentError();
  }

  if (await isTypeNameTaken(input.parentId, name, typeId)) {
    throw new TypeNameConflictError();
  }

  const sortOrder =
    input.parentId === current.parentId
      ? current.sortOrder
      : await getNextSortOrder(input.parentId);

  await getSqlite().runAsync(
    `UPDATE types
     SET parent_id = ?, name = ?, icon = ?, sort_order = ?, updated_at = ?
     WHERE id = ?;`,
    input.parentId,
    name,
    input.icon,
    sortOrder,
    Date.now(),
    typeId
  );
}

export async function reorderTypes(
  parentId: string | null,
  orderedIds: string[]
): Promise<void> {
  const rows = await getSqlite().getAllAsync<{ id: string }>(
    `SELECT id FROM types
     WHERE COALESCE(parent_id, '') = COALESCE(?, '');`,
    parentId
  );

  const currentIds = new Set(rows.map((row) => row.id));
  if (
    orderedIds.length !== rows.length ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    throw new Error('排序数据不是同一层级的完整列表');
  }

  const now = Date.now();

  await getSqlite().withTransactionAsync(async () => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await getSqlite().runAsync(
        'UPDATE types SET sort_order = ?, updated_at = ? WHERE id = ?;',
        index,
        now,
        orderedIds[index]
      );
    }
  });
}

export async function getTypeDeleteInfo(typeId: string): Promise<TypeDeleteInfo> {
  const typeIds = await getTypeDescendantIds(typeId);

  if (typeIds.length === 0) {
    return { typeIds: [], childCount: 0, todoCount: 0 };
  }

  const placeholders = typeIds.map(() => '?').join(', ');
  const row = await getSqlite().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM todos WHERE type_id IN (${placeholders});`,
    ...typeIds
  );

  return {
    typeIds,
    childCount: Math.max(0, typeIds.length - 1),
    todoCount: row?.count ?? 0,
  };
}

async function getTypeSnapshots(typeId: string): Promise<TypeSnapshot[]> {
  return getSqlite().getAllAsync<TypeSnapshot>(
    `WITH RECURSIVE subtree(id, depth) AS (
       SELECT id, 0 FROM types WHERE id = ?
       UNION ALL
       SELECT t.id, s.depth + 1 FROM types t JOIN subtree s ON t.parent_id = s.id
     )
     SELECT
       ty.id,
       ty.parent_id AS parentId,
       ty.name,
       ty.icon,
       ty.sort_order AS sortOrder,
       ty.created_at AS createdAt,
       ty.updated_at AS updatedAt
     FROM types ty
     JOIN subtree s ON s.id = ty.id
     ORDER BY s.depth ASC, ty.sort_order ASC;`,
    typeId
  );
}

async function getTodoSnapshotsByTypeIds(typeIds: string[]): Promise<TodoSnapshot[]> {
  if (typeIds.length === 0) return [];

  return getSqlite().getAllAsync<TodoSnapshot>(
    `SELECT ${TODO_SNAPSHOT_COLUMNS}
     FROM todos
     WHERE type_id IN (${typeIds.map(() => '?').join(', ')});`,
    ...typeIds
  );
}

export async function deleteTypeSubtree(typeId: string): Promise<TypeSubtreeSnapshot> {
  const typeIds = await getTypeDescendantIds(typeId);

  if (typeIds.length === 0) {
    throw new Error('类型不存在');
  }

  const types = await getTypeSnapshots(typeId);
  const todos = await getTodoSnapshotsByTypeIds(typeIds);

  await getSqlite().withTransactionAsync(async () => {
    await getSqlite().runAsync(
      `DELETE FROM todos WHERE type_id IN (${typeIds.map(() => '?').join(', ')});`,
      ...typeIds
    );
    await getSqlite().runAsync(
      `DELETE FROM types WHERE id IN (${typeIds.map(() => '?').join(', ')});`,
      ...typeIds
    );
  });

  return { typeIds, types, todos };
}

async function makeRestoredName(parentId: string | null, baseName: string): Promise<string> {
  let candidate = `${baseName}（已恢复）`;
  let counter = 2;

  while (await isTypeNameTaken(parentId, candidate)) {
    candidate = `${baseName}（已恢复 ${counter}）`;
    counter += 1;
  }

  return candidate;
}

export async function restoreTypeSubtree(
  snapshot: TypeSubtreeSnapshot
): Promise<RestoreTypeResult> {
  if (snapshot.types.length === 0) return { renamed: false };

  let renamed = false;

  await getSqlite().withTransactionAsync(async () => {
    for (const type of snapshot.types) {
      let name = type.name;

      if (await isTypeNameTaken(type.parentId, name)) {
        name = await makeRestoredName(type.parentId, name);
        renamed = true;
      }

      await getSqlite().runAsync(
        `INSERT OR REPLACE INTO types
           (id, parent_id, name, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        type.id,
        type.parentId,
        name,
        type.icon,
        type.sortOrder,
        type.createdAt,
        type.updatedAt
      );
    }

    for (const todo of snapshot.todos) {
      await getSqlite().runAsync(
        `INSERT OR REPLACE INTO todos
           (id, name, type_id, priority, due_at, detail, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        todo.id,
        todo.name,
        todo.typeId,
        todo.priority,
        todo.dueAt,
        todo.detail,
        todo.completedAt,
        todo.createdAt,
        todo.updatedAt
      );
    }
  });

  return { renamed };
}
