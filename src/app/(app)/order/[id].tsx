import { useLocalSearchParams } from 'expo-router';
import { OrderPlacedScreen } from '@/features/checkout';

export default function OrderRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  return <OrderPlacedScreen orderId={orderId ?? ''} />;
}
