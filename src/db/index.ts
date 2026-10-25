export { bootstrapDatabase } from './bootstrap';
export { getDb, getSqlite } from './client';
export { getDashboardStats, getTypeCount } from './queries';
export type { DashboardStats } from './queries';
export { getSetting, setSetting } from './settings-repository';
export {
  completeTodo,
  createTodo,
  deleteTodos,
  getTodoById,
  listCalendarTodos,
  listCompleted,
  listPending,
  listPendingWithDue,
  restoreTodos,
  uncompleteTodo,
  updateTodo,
} from './todo-repository';
export type {
  CompletedCursor,
  CompletedPage,
  TodoFilters,
  TodoInput,
  TodoListItem,
  TodoSnapshot,
} from './todo-repository';
export {
  createType,
  deleteTypeSubtree,
  getTypeById,
  getTypeDeleteInfo,
  getTypeDescendantIds,
  listTypes,
  reorderTypes,
  restoreTypeSubtree,
  TypeNameConflictError,
  TypeParentError,
  updateType,
} from './type-repository';
export type {
  RestoreTypeResult,
  TypeDeleteInfo,
  TypeInput,
  TypeSnapshot,
  TypeSubtreeSnapshot,
} from './type-repository';
export * from './schema';
