import { Screen } from '@/components';
import { useAuth } from '@/features/auth';
import { CustomerHomeScreen, RoleHomePlaceholder } from '@/features/customer';

export default function AppHomeScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role === 'customer') {
    return (
      <Screen padded={false}>
        <CustomerHomeScreen customerName={user.name} onLogout={() => void logout()} />
      </Screen>
    );
  }

  return (
    <RoleHomePlaceholder name={user.name} role={user.role} onLogout={() => void logout()} />
  );
}
