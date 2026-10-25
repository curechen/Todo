import { useEffect, useState } from 'react';

import { getTodoById, type TodoListItem } from '@/db';
import { useDataVersion } from '@/stores/data-version';

export function useTodo(id: string | undefined) {
  const version = useDataVersion((state) => state.version);
  const [todo, setTodo] = useState<TodoListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setTodo(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getTodoById(id)
      .then((row) => {
        if (mounted) setTodo(row);
      })
      .catch(() => {
        if (mounted) setTodo(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, version]);

  return { todo, loading };
}
