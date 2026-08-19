import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import { useCart } from './CartContext';

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, restaurant, subtotal, deliveryFee, totalAmount, increment, decrement, clearCart } =
    useCart();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="title">Cart</AppText>
        {items.length > 0 ? (
          <Pressable onPress={clearCart} hitSlop={8}>
            <AppText variant="caption" style={styles.clear}>
              Clear
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <AppText muted>Your cart is empty.</AppText>
          <Button label="Browse restaurants" onPress={() => router.replace(routes.app)} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list}>
            {restaurant ? (
              <AppText muted style={styles.restaurant}>
                From {restaurant.name}
              </AppText>
            ) : null}
            {items.map((line) => (
              <View key={line.menuItemId} style={styles.row}>
                {line.imageUrl ? <Image source={{ uri: line.imageUrl }} style={styles.image} /> : null}
                <View style={styles.body}>
                  <AppText style={styles.name}>{line.itemName}</AppText>
                  <AppText variant="caption" muted>
                    ETB {line.price} each
                  </AppText>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => decrement(line.menuItemId)} style={styles.stepButton}>
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <AppText>{line.quantity}</AppText>
                    <Pressable onPress={() => increment(line.menuItemId)} style={styles.stepButton}>
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
                <AppText style={styles.lineTotal}>ETB {line.price * line.quantity}</AppText>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.summaryRow}>
              <AppText muted>Subtotal</AppText>
              <AppText>ETB {subtotal}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText muted>Delivery</AppText>
              <AppText>ETB {deliveryFee}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.totalLabel}>Total</AppText>
              <AppText style={styles.totalLabel}>ETB {totalAmount}</AppText>
            </View>
            <Button label="Checkout" disabled />
            <AppText variant="caption" muted style={styles.note}>
              Checkout will be added in the next task.
            </AppText>
          </View>
        </>
      )}
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
  headerSpacer: {
    width: 40,
  },
  clear: {
    color: colors.danger,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  restaurant: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTotal: {
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontWeight: '700',
  },
  note: {
    textAlign: 'center',
  },
});
