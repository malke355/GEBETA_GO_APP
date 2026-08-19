import { useCallback, useEffect, useState } from 'react';
import { listRestaurants } from '@/api/restaurants';
import { getApiErrorMessage } from '@/api/errors';
import type { Restaurant } from '@/types';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listRestaurants();
      setRestaurants(data);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load restaurants'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { restaurants, loading, error, refresh };
}
