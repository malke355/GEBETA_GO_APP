import { useLocalSearchParams } from 'expo-router';
import { OrderTrackingScreen } from '@/features/orders';

export default function OrderRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  return <OrderTrackingScreen orderId={orderId ?? ''} />;
}
