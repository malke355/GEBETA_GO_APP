import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components';
import { APP_NAME } from '@/config';
import { OFFERS } from '@/features/offers/offers';
import { useLanguage } from '@/i18n';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.app))} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="title">{t.about}</AppText>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{APP_NAME}</AppText>
        <AppText muted>
          GebetaGo is a multi-role food delivery app for Addis Ababa: customers, restaurant kitchens,
          couriers, and platform admins share the same live order flow.
        </AppText>
        <AppText style={styles.section}>{t.offersTitle}</AppText>
        {OFFERS.map((offer) => (
          <View key={offer.id} style={styles.card}>
            <AppText style={styles.strong}>{offer.title}</AppText>
            <AppText muted>{offer.detail}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  section: {
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  strong: {
    fontWeight: '700',
  },
});
