import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen } from '@/components';
import { APP_NAME, env } from '@/config';
import { useAuth } from '@/features/auth';
import { spacing } from '@/theme';

export default function AppHomeScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{APP_NAME}</AppText>
        <AppText muted>
          Signed in as {user?.name} ({user?.role})
        </AppText>
      </View>
      <AppText muted>
        {env.useMockApi
          ? 'Running with mock data so screens can be built before the backend is connected.'
          : 'Connected to the GebetaGo API.'}
      </AppText>
      <AppText muted>
        Customer browsing, cart, and orders will be added in the next tasks.
      </AppText>
      <Button label="Log out" variant="secondary" onPress={() => void logout()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
});
