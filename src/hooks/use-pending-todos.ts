import { useEffect, useState } from 'react';

import { listPending, type TodoFilters, type TodoListItem } from '@/db';
import type { SortMode } from '@/lib/sort';
import { useDataVersion } from '@/stores/data-version';

export function usePendingTodos(filters: TodoFilters, sortMode: SortMode) {
  const version = useDataVersion((state) => state.version);
  const [items, setItems] = useState<TodoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const priorityKey = filters.priorities.join(',');
  const priorities = filters.priorities;
  const typeId = filters.typeId;
  const keyword = filters.keyword;
  const overdueOnly = filters.overdueOnly;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listPending({ typeId, keyword, priorities, overdueOnly }, sortMode)
      .then((rows) => {
        if (mounted) setItems(rows);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [typeId, keyword, priorityKey, overdueOnly, sortMode, version]);

  return { items, loading };
}
