import { useEffect, useState } from 'react';

import { listTypes } from '@/db';
import type { TypeRow } from '@/db/schema';
import { useDataVersion } from '@/stores/data-version';

export function useTypes() {
  const version = useDataVersion((state) => state.version);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listTypes()
      .then((rows) => {
        if (mounted) setTypes(rows);
      })
      .catch(() => {
        if (mounted) setTypes([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [version]);

  return { types, loading };
}
