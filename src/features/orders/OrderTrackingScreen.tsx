import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelOrder, getOrder } from '@/api/orders';
import { emitRealtime, subscribeRealtime } from '@/api/socket';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { env } from '@/config';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import type { Order } from '@/types';
import { OrderTimeline } from './OrderTimeline';
import { PAYMENT_LABELS, isActiveOrderStatus, statusHeadline } from './orderStatus';

const POLL_MS = 2500;

type OrderTrackingScreenProps = {
  orderId: string;
};

export function OrderTrackingScreen({ orderId }: OrderTrackingScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (isPoll = false) => {
    if (!orderId) {
      setError('Order not found');
      return;
    }

    try {
      setOrder(await getOrder(orderId));
      setError(null);
    } catch (caught) {
      if (!isPoll) {
        setError(getApiErrorMessage(caught, 'Could not load this order'));
      }
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (env.useMockApi || !orderId) {
      return;
    }

    emitRealtime('join_order', orderId);
    const unsub = subscribeRealtime('order_status_updated', (payload) => {
      if (!payload.orderId || payload.orderId === orderId) {
        void load(true);
      }
    });

    return () => {
      emitRealtime('leave_order', orderId);
      unsub();
    };
  }, [load, orderId]);

  useEffect(() => {
    if (!order || !isActiveOrderStatus(order.status)) {
      return;
    }

    const timer = setInterval(() => {
      void load(true);
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [load, order?.status]);

  const handleCancel = () => {
    Alert.alert('Cancel this order?', 'You can only cancel before the restaurant confirms.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setCancelling(true);
            try {
              setOrder(await cancelOrder(orderId));
            } catch (caught) {
              Alert.alert('Could not cancel', getApiErrorMessage(caught));
            } finally {
              setCancelling(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.app))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="title">Track order</AppText>
        <View style={styles.headerSpacer} />
      </View>

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
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <Ionicons
                name={
                  order.status === 'delivered'
                    ? 'checkmark-circle'
                    : order.status === 'cancelled'
                      ? 'close-circle'
                      : 'bicycle'
                }
                size={48}
                color={order.status === 'cancelled' ? colors.danger : colors.primary}
              />
              <AppText variant="title" style={styles.centerText}>
                {order.restaurantName}
              </AppText>
              <AppText muted style={styles.centerText}>
                {statusHeadline(order.status)}
              </AppText>
              {order.etaMinutes && isActiveOrderStatus(order.status) ? (
                <AppText variant="caption" style={styles.eta}>
                  About {order.etaMinutes} min remaining
                </AppText>
              ) : null}
            </View>

            {order.status === 'cancelled' ? (
              <View style={styles.cancelledCard}>
                <AppText muted>This order was cancelled and will not be delivered.</AppText>
              </View>
            ) : (
              <OrderTimeline status={order.status} />
            )}

            {order.driverName && (order.status === 'dispatched' || order.status === 'picked_up') ? (
              <View style={styles.card}>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <AppText style={styles.liveLabel}>Live courier tracking</AppText>
                </View>
                <View style={styles.row}>
                  <AppText muted>Courier</AppText>
                  <AppText>{order.driverName}</AppText>
                </View>
                {order.driverPhone ? (
                  <View style={styles.row}>
                    <AppText muted>Phone</AppText>
                    <AppText>{order.driverPhone}</AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.row}>
                <AppText muted>Order</AppText>
                <AppText style={styles.orderId}>{order.id}</AppText>
              </View>
              <View style={styles.row}>
                <AppText muted>Payment</AppText>
                <AppText>{PAYMENT_LABELS[order.paymentMethod]}</AppText>
              </View>
              <View style={styles.row}>
                <AppText muted>Deliver to</AppText>
                <AppText style={styles.address}>{order.deliveryAddress}</AppText>
              </View>
              {order.items.map((line) => (
                <View key={line.menuItemId} style={styles.row}>
                  <AppText muted>
                    {line.quantity}× {line.itemName}
                  </AppText>
                  <AppText>ETB {line.price * line.quantity}</AppText>
                </View>
              ))}
              <View style={styles.row}>
                <AppText style={styles.total}>Total</AppText>
                <AppText style={styles.total}>ETB {order.totalAmount}</AppText>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {order.status === 'placed' ? (
              <Button
                label="Cancel order"
                variant="secondary"
                loading={cancelling}
                onPress={handleCancel}
              />
            ) : null}
            {order.status === 'delivered' ? (
              <Button
                label="Order again"
                onPress={() => router.push(routes.restaurant(order.restaurantId) as Href)}
              />
            ) : null}
            <Button label="Back to home" variant="secondary" onPress={() => router.replace(routes.app)} />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  eta: {
    color: colors.primary,
    fontWeight: '700',
  },
  cancelledCard: {
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
    borderRadius: 16,
    padding: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  liveLabel: {
    fontWeight: '700',
    color: '#16A34A',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  orderId: {
    flex: 1,
    textAlign: 'right',
  },
  address: {
    flex: 1,
    textAlign: 'right',
  },
  total: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
