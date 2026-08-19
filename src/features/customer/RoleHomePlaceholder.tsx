import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen } from '@/components';
import { APP_NAME } from '@/config';
import { spacing } from '@/theme';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant: 'Merchant',
  driver: 'Driver',
  admin: 'Admin',
};

type RoleHomePlaceholderProps = {
  name: string;
  role: UserRole;
  onLogout: () => void;
};

export function RoleHomePlaceholder({ name, role, onLogout }: RoleHomePlaceholderProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{APP_NAME}</AppText>
        <AppText muted>
          Signed in as {name} ({ROLE_LABELS[role]})
        </AppText>
      </View>
      <AppText muted>
        The {ROLE_LABELS[role].toLowerCase()} dashboard will be built after the customer ordering flow.
      </AppText>
      <Button label="Log out" variant="secondary" onPress={onLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
});
