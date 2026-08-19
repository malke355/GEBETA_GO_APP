import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { cancelOrder, updateOrderStatus, verifyOrderPayment } from '@/api/orders';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { PAYMENT_LABELS, statusLabel } from '@/features/orders';
import { colors, spacing } from '@/theme';
import type { Order } from '@/types';

type KitchenOrderCardProps = {
  order: Order;
  onUpdated: (order: Order) => void;
};

export function KitchenOrderCard({ order, onUpdated }: KitchenOrderCardProps) {
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<Order>, failureTitle: string) => {
    setBusy(true);
    try {
      onUpdated(await action());
    } catch (error) {
      Alert.alert(failureTitle, getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.customer}>{order.customerName ?? 'Customer'}</AppText>
          <AppText variant="caption" muted>
            {order.deliveryAddress}
          </AppText>
        </View>
        <View style={styles.badge}>
          <AppText variant="caption" style={styles.badgeText}>
            {statusLabel(order.status)}
          </AppText>
        </View>
      </View>

      <View style={styles.items}>
        {order.items.map((line) => (
          <View key={line.menuItemId} style={styles.itemRow}>
            <AppText muted>
              {line.quantity}× {line.itemName}
            </AppText>
            <AppText>ETB {line.price * line.quantity}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.itemRow}>
        <AppText muted>{PAYMENT_LABELS[order.paymentMethod]}</AppText>
        <AppText variant="caption" style={styles.paymentStatus}>
          {order.paymentStatus.split('_').join(' ')}
        </AppText>
      </View>
      <View style={styles.itemRow}>
        <AppText style={styles.total}>Total</AppText>
        <AppText style={styles.total}>ETB {order.totalAmount}</AppText>
      </View>

      {order.status === 'prepared' ? (
        <AppText variant="caption" muted>
          Waiting for a courier to pick this up.
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {order.paymentStatus === 'proof_submitted' ? (
          <Button
            label="Approve payment"
            variant="secondary"
            loading={busy}
            onPress={() => void run(() => verifyOrderPayment(order.id), 'Could not verify payment')}
          />
        ) : null}
        {order.status === 'placed' ? (
          <Button
            label="Confirm order"
            loading={busy}
            onPress={() => void run(() => updateOrderStatus(order.id, 'confirmed'), 'Could not confirm order')}
          />
        ) : null}
        {order.status === 'confirmed' ? (
          <Button
            label="Mark prepared"
            loading={busy}
            onPress={() => void run(() => updateOrderStatus(order.id, 'prepared'), 'Could not update order')}
          />
        ) : null}
        {order.status === 'placed' || order.status === 'confirmed' ? (
          <Pressable
            disabled={busy}
            onPress={() =>
              Alert.alert('Cancel this order?', 'The customer will be notified.', [
                { text: 'Keep', style: 'cancel' },
                {
                  text: 'Cancel order',
                  style: 'destructive',
                  onPress: () => void run(() => cancelOrder(order.id), 'Could not cancel order'),
                },
              ])
            }
          >
            <AppText variant="caption" style={styles.cancel}>
              Cancel
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  customer: {
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  items: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paymentStatus: {
    textTransform: 'capitalize',
  },
  total: {
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
  cancel: {
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
});
