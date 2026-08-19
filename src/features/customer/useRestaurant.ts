import { useCallback, useEffect, useState } from 'react';
import { getRestaurant } from '@/api/restaurants';
import { getApiErrorMessage } from '@/api/errors';
import type { Restaurant } from '@/types';

export function useRestaurant(id: string | undefined) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setRestaurant(null);
      setError('Restaurant not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setRestaurant(await getRestaurant(id));
    } catch (caught) {
      setRestaurant(null);
      setError(getApiErrorMessage(caught, 'Could not load this restaurant'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { restaurant, loading, error, refresh };
}
