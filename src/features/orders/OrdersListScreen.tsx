import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listMyOrders } from '@/api/orders';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import type { Order } from '@/types';
import { isActiveOrderStatus, statusHeadline, statusLabel } from './orderStatus';

export function OrdersListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setOrders(await listMyOrders());
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load orders'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const active = orders.filter((order) => isActiveOrderStatus(order.status));
  const past = orders.filter((order) => !isActiveOrderStatus(order.status));

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
        <AppText variant="title">Orders</AppText>
        <View style={styles.headerSpacer} />
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centered}>
          <AppText muted>{error}</AppText>
          <Button label="Try again" onPress={() => void load()} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <AppText muted>You have no orders yet.</AppText>
          <Button label="Browse restaurants" onPress={() => router.replace(routes.app)} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
        >
          {active.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="caption" muted>
                In progress
              </AppText>
              {active.map((order) => (
                <OrderRow key={order.id} order={order} onPress={() => router.push(routes.order(order.id) as Href)} />
              ))}
            </View>
          ) : null}
          {past.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="caption" muted>
                Past orders
              </AppText>
              {past.map((order) => (
                <OrderRow key={order.id} order={order} onPress={() => router.push(routes.order(order.id) as Href)} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

type OrderRowProps = {
  order: Order;
  onPress: () => void;
};

function OrderRow({ order, onPress }: OrderRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowBody}>
        <AppText style={styles.name}>{order.restaurantName}</AppText>
        <AppText variant="caption" muted>
          {statusHeadline(order.status)}
        </AppText>
        <AppText variant="caption" muted>
          ETB {order.totalAmount}
        </AppText>
      </View>
      <View style={styles.rowMeta}>
        <AppText variant="caption" style={isActiveOrderStatus(order.status) ? styles.active : undefined}>
          {statusLabel(order.status)}
        </AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  active: {
    color: colors.primary,
    fontWeight: '700',
  },
});
