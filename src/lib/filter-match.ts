import { getTypeDescendantIds } from '@/db';
import type { Priority } from './priority';
import type { FilterState } from '@/stores/filters';

export interface FilterMatchInput {
  name: string;
  detail: string;
  typeId: string;
  priority: Priority;
  dueAt: number | null;
  completedAt: number | null;
}

export async function matchesFilter(
  input: FilterMatchInput,
  filter: FilterState
): Promise<boolean> {
  if (filter.typeId) {
    const typeIds = await getTypeDescendantIds(filter.typeId);
    if (!typeIds.includes(input.typeId)) return false;
  }

  if (filter.priorities.length > 0 && !filter.priorities.includes(input.priority)) {
    return false;
  }

  const keyword = filter.keyword.trim().toLowerCase();
  if (keyword) {
    const name = input.name.toLowerCase();
    const detail = input.detail.toLowerCase();
    if (!name.includes(keyword) && !detail.includes(keyword)) return false;
  }

  if (filter.overdueOnly) {
    const overdue =
      input.dueAt != null && input.completedAt == null && input.dueAt < Date.now();
    if (!overdue) return false;
  }

  return true;
}
