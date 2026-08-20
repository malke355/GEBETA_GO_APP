import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listRestaurantOrders } from '@/api/orders';
import { createRestaurant, getMyRestaurant } from '@/api/restaurants';
import { subscribeRealtime } from '@/api/socket';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components';
import { env } from '@/config';
import { isActiveOrderStatus } from '@/features/orders';
import { colors, spacing } from '@/theme';
import type { Order, Restaurant } from '@/types';
import { KitchenOrderCard } from './KitchenOrderCard';
import { MenuManager } from './MenuManager';

const POLL_MS = 4000;

type DashboardTab = 'kitchen' | 'menu';

type RestaurantDashboardScreenProps = {
  ownerName: string;
  onLogout: () => void;
};

export function RestaurantDashboardScreen({ ownerName, onLogout }: RestaurantDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<DashboardTab>('kitchen');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [cuisineType, setCuisineType] = useState('Ethiopian Traditional');
  const [address, setAddress] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const profile = await getMyRestaurant();
      setRestaurant(profile);
      if (profile) {
        setOrders(await listRestaurantOrders());
      } else {
        setOrders([]);
      }
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load the kitchen'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (env.useMockApi) {
      return;
    }

    const refresh = () => {
      void load();
    };

    const offOrder = subscribeRealtime('new_order', refresh);
    const offStatus = subscribeRealtime('order_status_updated', refresh);
    const offPayment = subscribeRealtime('payment_status_updated', refresh);
    return () => {
      offOrder();
      offStatus();
      offPayment();
    };
  }, [load]);

  useEffect(() => {
    if (!restaurant || tab !== 'kitchen') {
      return;
    }

    const timer = setInterval(() => {
      void load();
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [load, restaurant?.id, tab]);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }
    setCreating(true);
    try {
      const created = await createRestaurant({
        name: name.trim(),
        cuisineType,
        address,
      });
      setRestaurant(created);
      setOrders([]);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not create restaurant'));
    } finally {
      setCreating(false);
    }
  };

  const activeOrders = orders.filter((order) => isActiveOrderStatus(order.status));
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const revenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" muted>
            Merchant kitchen
          </AppText>
          <AppText variant="title">{restaurant?.name ?? ownerName}</AppText>
        </View>
        <Pressable onPress={onLogout} hitSlop={8} accessibilityRole="button" accessibilityLabel="Log out">
          <AppText variant="caption" style={styles.logout}>
            Log out
          </AppText>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && !restaurant ? (
        <View style={styles.centered}>
          <AppText muted>{error}</AppText>
          <Button label="Try again" onPress={() => void load()} />
        </View>
      ) : !restaurant ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form}>
            <AppText muted>Create your restaurant profile to start receiving orders.</AppText>
            <TextField label="Restaurant name" value={name} onChangeText={setName} placeholder="Lucy Ethiopian Restaurant" />
            <TextField label="Cuisine" value={cuisineType} onChangeText={setCuisineType} placeholder="Ethiopian Traditional" />
            <TextField label="Address" value={address} onChangeText={setAddress} placeholder="Bole Road, Addis Ababa" />
            <Button label="Create store profile" loading={creating} onPress={() => void handleCreate()} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={styles.metrics}>
            <Metric label="Active" value={String(activeOrders.length)} />
            <Metric label="Delivered" value={String(deliveredOrders.length)} />
            <Metric label="Sales" value={`${revenue} ETB`} />
          </View>

          <View style={styles.tabs}>
            <Pressable onPress={() => setTab('kitchen')} style={[styles.tab, tab === 'kitchen' && styles.tabActive]}>
              <AppText style={tab === 'kitchen' ? styles.tabLabelActive : styles.tabLabel}>Kitchen</AppText>
            </Pressable>
            <Pressable onPress={() => setTab('menu')} style={[styles.tab, tab === 'menu' && styles.tabActive]}>
              <AppText style={tab === 'menu' ? styles.tabLabelActive : styles.tabLabel}>Menu</AppText>
            </Pressable>
          </View>

          {tab === 'kitchen' ? (
            <ScrollView
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
              }
            >
              {activeOrders.length === 0 ? (
                <AppText muted style={styles.empty}>
                  No active orders in the queue. New customer orders will appear here.
                </AppText>
              ) : (
                activeOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onUpdated={(updated) => {
                      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                    }}
                  />
                ))
              )}
            </ScrollView>
          ) : (
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
                <MenuManager restaurant={restaurant} onRestaurantChange={setRestaurant} />
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </>
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText style={styles.metricValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  logout: {
    color: colors.danger,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    gap: 2,
  },
  metricValue: {
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  tabLabel: {
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
