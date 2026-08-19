import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components';
import { APP_NAME } from '@/config';
import { useAuth } from '@/features/auth';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme';

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <StatusBar style="dark" />
        <AppText variant="title">{APP_NAME}</AppText>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
  },
});
