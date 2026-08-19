import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/components';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import { useCart } from './CartContext';

export function CartBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itemCount, totalAmount, restaurant } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <Pressable
        onPress={() => router.push(routes.cart)}
        style={styles.bar}
        accessibilityRole="button"
        accessibilityLabel="View cart"
      >
        <View>
          <AppText style={styles.label}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {restaurant ? ` · ${restaurant.name}` : ''}
          </AppText>
          <AppText variant="caption" style={styles.caption}>
            View cart
          </AppText>
        </View>
        <AppText style={styles.total}>ETB {totalAmount}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'transparent',
  },
  bar: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.primaryContrast,
    fontWeight: '700',
  },
  caption: {
    color: colors.primaryContrast,
    opacity: 0.85,
  },
  total: {
    color: colors.primaryContrast,
    fontWeight: '700',
  },
});
