import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchAdminOrders,
  fetchAdminRestaurants,
  fetchAdminStats,
  fetchAdminUsers,
  setRestaurantSuspended,
  setUserSuspended,
} from '@/api/admin';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { statusLabel } from '@/features/orders';
import { colors, spacing } from '@/theme';
import type { AdminRestaurant, AdminStats, AdminUser, Order } from '@/types';

type AdminTab = 'overview' | 'users' | 'restaurants' | 'orders';

type AdminDashboardScreenProps = {
  adminName: string;
  adminId: string;
  onLogout: () => void;
};

const EMPTY_STATS: AdminStats = {
  summary: {
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    platformCommission: 0,
    completedOrders: 0,
  },
  statusCounts: {
    placed: 0,
    confirmed: 0,
    prepared: 0,
    dispatched: 0,
    picked_up: 0,
    delivered: 0,
    cancelled: 0,
  },
  restaurantSales: [],
  usersByRole: {},
};

export function AdminDashboardScreen({ adminName, adminId, onLogout }: AdminDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const [nextStats, nextUsers, nextRestaurants, nextOrders] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminRestaurants(),
        fetchAdminOrders(),
      ]);
      setStats(nextStats);
      setUsers(nextUsers);
      setRestaurants(nextRestaurants);
      setOrders(nextOrders);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load the admin dashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleUser = async (user: AdminUser) => {
    if (user.id === adminId) {
      Alert.alert('Not allowed', 'You cannot suspend your own account.');
      return;
    }
    setBusyId(user.id);
    try {
      const updated = await setUserSuspended(user.id, !user.isSuspended);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      Alert.alert('Could not update user', getApiErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  const toggleRestaurant = async (restaurant: AdminRestaurant) => {
    setBusyId(restaurant.id);
    try {
      const updated = await setRestaurantSuspended(restaurant.id, restaurant.isSuspended !== true);
      setRestaurants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      Alert.alert('Could not update restaurant', getApiErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" muted>
            Platform admin
          </AppText>
          <AppText variant="title">Hi, {adminName.split(' ')[0] ?? adminName}</AppText>
        </View>
        <Pressable onPress={onLogout} hitSlop={8} accessibilityRole="button" accessibilityLabel="Log out">
          <AppText variant="caption" style={styles.logout}>
            Log out
          </AppText>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'users', 'restaurants', 'orders'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setTab(option)}
            style={[styles.tab, tab === option && styles.tabActive]}
          >
            <AppText style={tab === option ? styles.tabLabelActive : styles.tabLabel}>
              {option === 'overview' ? 'Stats' : option[0]?.toUpperCase() + option.slice(1)}
            </AppText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText muted>{error}</AppText>
          <Button label="Try again" onPress={() => void load()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
        >
          {tab === 'overview' ? (
            <>
              <View style={styles.metrics}>
                <Metric label="Users" value={String(stats.summary.totalUsers)} />
                <Metric label="Stores" value={String(stats.summary.totalRestaurants)} />
                <Metric label="Orders" value={String(stats.summary.totalOrders)} />
              </View>
              <View style={styles.metrics}>
                <Metric label="Sales" value={`${Math.round(stats.summary.totalRevenue)} ETB`} />
                <Metric label="Fee 15%" value={`${Math.round(stats.summary.platformCommission)} ETB`} />
                <Metric label="Delivered" value={String(stats.summary.completedOrders)} />
              </View>
              <AppText style={styles.section}>Top restaurants</AppText>
              {stats.restaurantSales.length === 0 ? (
                <AppText muted>No delivered orders yet.</AppText>
              ) : (
                stats.restaurantSales.map((row) => (
                  <View key={row.name} style={styles.card}>
                    <AppText style={styles.strong}>{row.name}</AppText>
                    <AppText muted>
                      {row.orderCount} orders · {Math.round(row.sales)} ETB
                    </AppText>
                  </View>
                ))
              )}
            </>
          ) : null}

          {tab === 'users'
            ? users.map((user) => (
                <View key={user.id} style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <AppText style={styles.strong}>{user.name}</AppText>
                      <AppText variant="caption" muted>
                        {user.email} · {user.role}
                      </AppText>
                    </View>
                    <Button
                      label={user.isSuspended ? 'Reinstate' : 'Suspend'}
                      variant="secondary"
                      loading={busyId === user.id}
                      onPress={() => void toggleUser(user)}
                    />
                  </View>
                </View>
              ))
            : null}

          {tab === 'restaurants'
            ? restaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <AppText style={styles.strong}>{restaurant.name}</AppText>
                      <AppText variant="caption" muted>
                        {restaurant.cuisineType} · {restaurant.orderCount} orders
                        {restaurant.isSuspended ? ' · suspended' : ''}
                      </AppText>
                    </View>
                    <Button
                      label={restaurant.isSuspended ? 'Reinstate' : 'Suspend'}
                      variant="secondary"
                      loading={busyId === restaurant.id}
                      onPress={() => void toggleRestaurant(restaurant)}
                    />
                  </View>
                </View>
              ))
            : null}

          {tab === 'orders'
            ? orders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={styles.row}>
                    <AppText style={styles.strong}>{order.restaurantName}</AppText>
                    <AppText variant="caption">{statusLabel(order.status)}</AppText>
                  </View>
                  <AppText muted>
                    {order.customerName ?? 'Customer'} · ETB {order.totalAmount}
                  </AppText>
                </View>
              ))
            : null}
        </ScrollView>
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
    paddingHorizontal: 4,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  strong: {
    fontWeight: '700',
  },
});
