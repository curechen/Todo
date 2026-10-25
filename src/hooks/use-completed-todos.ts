import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listCompleted,
  type CompletedCursor,
  type TodoFilters,
  type TodoListItem,
} from '@/db';
import { useDataVersion } from '@/stores/data-version';

export function useCompletedTodos(filters: TodoFilters) {
  const version = useDataVersion((state) => state.version);
  const [items, setItems] = useState<TodoListItem[]>([]);
  const [cursor, setCursor] = useState<CompletedCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestIdRef = useRef(0);
  const typeId = filters.typeId;
  const keyword = filters.keyword;
  const priorities = filters.priorities;
  const priorityKey = filters.priorities.join(',');

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadingMore(false);
    setItems([]);
    setCursor(null);
    setHasMore(true);

    listCompleted(
      { typeId, keyword, priorities, overdueOnly: false },
      null,
      30
    )
      .then((page) => {
        if (requestId !== requestIdRef.current) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
        setCursor(null);
        setHasMore(false);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [typeId, keyword, priorityKey, version]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    setLoadingMore(true);

    try {
      const page = await listCompleted(
        { typeId, keyword, priorities, overdueOnly: false },
        cursor,
        30
      );

      if (requestId !== requestIdRef.current) return;
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch {
      // Keep the current page on failure.
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, typeId, keyword, priorityKey, cursor]);

  return { items, loading, loadingMore, hasMore, loadMore };
}
