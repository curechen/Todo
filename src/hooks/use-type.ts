import { useEffect, useState } from 'react';

import { getTypeById } from '@/db';
import type { TypeRow } from '@/db/schema';
import { useDataVersion } from '@/stores/data-version';

export function useType(id: string | undefined) {
  const version = useDataVersion((state) => state.version);
  const [type, setType] = useState<TypeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setType(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getTypeById(id)
      .then((row) => {
        if (mounted) setType(row);
      })
      .catch(() => {
        if (mounted) setType(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, version]);

  return { type, loading };
}
