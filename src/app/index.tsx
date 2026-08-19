import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { routes } from '@/navigation';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? routes.app : routes.auth} />;
}
