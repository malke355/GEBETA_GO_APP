import { Redirect } from 'expo-router';
import { routes } from '@/navigation';

export default function Index() {
  return <Redirect href={routes.app} />;
}
