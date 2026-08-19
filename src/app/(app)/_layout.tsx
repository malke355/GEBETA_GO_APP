import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth';
import { routes } from '@/navigation';

export default function AppGroupLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href={routes.auth} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
