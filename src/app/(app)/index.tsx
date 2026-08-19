import { Screen } from '@/components';
import { useAuth } from '@/features/auth';
import { CustomerHomeScreen, RoleHomePlaceholder } from '@/features/customer';
import { DriverDashboardScreen } from '@/features/driver';
import { RestaurantDashboardScreen } from '@/features/restaurant';

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

  if (user.role === 'restaurant') {
    return (
      <Screen padded={false}>
        <RestaurantDashboardScreen ownerName={user.name} onLogout={() => void logout()} />
      </Screen>
    );
  }

  if (user.role === 'driver') {
    return (
      <Screen padded={false}>
        <DriverDashboardScreen driverName={user.name} onLogout={() => void logout()} />
      </Screen>
    );
  }

  return (
    <RoleHomePlaceholder name={user.name} role={user.role} onLogout={() => void logout()} />
  );
}
