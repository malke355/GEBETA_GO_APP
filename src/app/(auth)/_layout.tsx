import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth';
import { routes } from '@/navigation';

export default function AuthGroupLayout() {
  const { user } = useAuth();

  if (user) {
    return <Redirect href={routes.app} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
