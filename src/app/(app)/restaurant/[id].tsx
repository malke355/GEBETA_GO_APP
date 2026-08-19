import { useLocalSearchParams, useRouter } from 'expo-router';
import { RestaurantMenuScreen } from '@/features/customer';

export default function RestaurantMenuRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <RestaurantMenuScreen
      restaurantId={restaurantId ?? ''}
      onBack={() => router.back()}
    />
  );
}
