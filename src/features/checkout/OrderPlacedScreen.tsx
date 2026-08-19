import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getOrder } from '@/api/orders';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import type { Order } from '@/types';

const PAYMENT_LABELS = {
  cash: 'Cash on delivery',
  telebirr: 'Telebirr',
  bank_transfer: 'Bank transfer',
} as const;

type OrderPlacedScreenProps = {
  orderId: string;
};

export function OrderPlacedScreen({ orderId }: OrderPlacedScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError('Order not found');
        return;
      }

      try {
        setOrder(await getOrder(orderId));
      } catch (caught) {
        setError(getApiErrorMessage(caught, 'Could not load this order'));
      }
    };

    void load();
  }, [orderId]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      {error ? (
        <View style={styles.centered}>
          <AppText muted>{error}</AppText>
          <Button label="Go home" onPress={() => router.replace(routes.app)} />
        </View>
      ) : !order ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.centerText}>
            Order placed
          </AppText>
          <AppText muted style={styles.centerText}>
            {order.restaurantName} is preparing your order.
          </AppText>
          <View style={styles.card}>
            <View style={styles.row}>
              <AppText muted>Order</AppText>
              <AppText>{order.id}</AppText>
            </View>
            <View style={styles.row}>
              <AppText muted>Status</AppText>
              <AppText style={styles.capitalize}>{order.status}</AppText>
            </View>
            <View style={styles.row}>
              <AppText muted>Payment</AppText>
              <AppText>{PAYMENT_LABELS[order.paymentMethod]}</AppText>
            </View>
            <View style={styles.row}>
              <AppText muted>Deliver to</AppText>
              <AppText style={styles.address}>{order.deliveryAddress}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.total}>Total</AppText>
              <AppText style={styles.total}>ETB {order.totalAmount}</AppText>
            </View>
          </View>
          <Button label="Back to home" onPress={() => router.replace(routes.app)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  address: {
    flex: 1,
    textAlign: 'right',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  total: {
    fontWeight: '700',
  },
});
