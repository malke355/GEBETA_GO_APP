import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { AppText, Button, Screen } from '@/components';
import { routes } from '@/navigation';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <Screen>
        <AppText variant="title">Screen not found</AppText>
        <AppText muted>This route does not exist yet.</AppText>
        <Link href={routes.app} asChild>
          <Button label="Go home" style={styles.action} />
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'flex-start',
  },
});
