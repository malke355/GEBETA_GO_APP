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
  acceptJob,
  getActiveDelivery,
  listAvailableJobs,
  listDriverHistory,
  updateOrderStatus,
} from '@/api/orders';
import { subscribeRealtime } from '@/api/socket';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button } from '@/components';
import { env } from '@/config';
import { PAYMENT_LABELS, statusLabel } from '@/features/orders';
import { colors, spacing } from '@/theme';
import type { DriverHistory, Order } from '@/types';

const POLL_MS = 4000;

type DriverTab = 'route' | 'jobs' | 'history';

type DriverDashboardScreenProps = {
  driverName: string;
  onLogout: () => void;
};

export function DriverDashboardScreen({ driverName, onLogout }: DriverDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<DriverTab>('jobs');
  const [jobs, setJobs] = useState<Order[]>([]);
  const [active, setActive] = useState<Order | null>(null);
  const [history, setHistory] = useState<DriverHistory>({ orders: [], totalDeliveries: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const [available, current, past] = await Promise.all([
        listAvailableJobs(),
        getActiveDelivery(),
        listDriverHistory(),
      ]);
      setJobs(available);
      setActive(current);
      setHistory(past);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load deliveries'));
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

    const offJob = subscribeRealtime('new_job', refresh);
    const offStatus = subscribeRealtime('order_status_updated', refresh);
    return () => {
      offJob();
      offStatus();
    };
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    setProgress(0);
    setSimulating(false);
  }, [active?.id, active?.status]);

  useEffect(() => {
    if (!simulating || progress >= 100) {
      if (progress >= 100) {
        setSimulating(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setProgress((current) => Math.min(100, current + 10));
    }, 500);

    return () => clearTimeout(timer);
  }, [progress, simulating]);

  const run = async (action: () => Promise<Order | void>, failureTitle: string) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (caught) {
      Alert.alert(failureTitle, getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" muted>
            Courier
          </AppText>
          <AppText variant="title">Hi, {driverName.split(' ')[0] ?? driverName}</AppText>
        </View>
        <Pressable onPress={onLogout} hitSlop={8} accessibilityRole="button" accessibilityLabel="Log out">
          <AppText variant="caption" style={styles.logout}>
            Log out
          </AppText>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric label="Active" value={active ? '1' : '0'} />
        <Metric label="Jobs" value={String(jobs.length)} />
        <Metric label="Earned" value={`${history.totalEarnings} ETB`} />
      </View>

      <View style={styles.tabs}>
        {(['route', 'jobs', 'history'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setTab(option)}
            style={[styles.tab, tab === option && styles.tabActive]}
          >
            <AppText style={tab === option ? styles.tabLabelActive : styles.tabLabel}>
              {option === 'route' ? 'Route' : option === 'jobs' ? 'Jobs' : 'History'}
            </AppText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && !active && jobs.length === 0 ? (
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
          {tab === 'route' ? (
            !active ? (
              <AppText muted style={styles.empty}>
                No active delivery route assigned. Accept a job from the board to begin.
              </AppText>
            ) : (
              <View style={styles.card}>
                <View style={styles.badge}>
                  <AppText variant="caption" style={styles.badgeText}>
                    {statusLabel(active.status)}
                  </AppText>
                </View>
                <AppText variant="caption" muted>
                  Pickup from
                </AppText>
                <AppText style={styles.strong}>{active.restaurantName}</AppText>
                <AppText muted>{active.restaurantAddress ?? 'Restaurant'}</AppText>
                <AppText variant="caption" muted style={styles.sectionLabel}>
                  Deliver to
                </AppText>
                <AppText style={styles.strong}>{active.customerName ?? 'Customer'}</AppText>
                <AppText muted>{active.deliveryAddress}</AppText>
                {active.customerPhone ? (
                  <AppText variant="caption" muted>
                    {active.customerPhone}
                  </AppText>
                ) : null}
                <View style={styles.items}>
                  {active.items.map((line) => (
                    <View key={line.menuItemId} style={styles.row}>
                      <AppText muted>
                        {line.quantity}× {line.itemName}
                      </AppText>
                      <AppText>ETB {line.price * line.quantity}</AppText>
                    </View>
                  ))}
                </View>
                <View style={styles.row}>
                  <AppText muted>{PAYMENT_LABELS[active.paymentMethod]}</AppText>
                  <AppText style={styles.strong}>ETB {active.totalAmount}</AppText>
                </View>
                {active.status === 'dispatched' ? (
                  <>
                    <AppText variant="caption" muted>
                      {active.paymentMethod === 'cash'
                        ? `Head to the restaurant to collect the food. Collect ETB ${active.totalAmount} in cash on delivery.`
                        : 'Head to the restaurant to collect the food.'}
                    </AppText>
                    <Button
                      label="Confirm picked up"
                      loading={busy}
                      onPress={() =>
                        void run(
                          () => updateOrderStatus(active.id, 'picked_up'),
                          'Could not update pickup',
                        )
                      }
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.progressHeader}>
                      <AppText variant="caption" muted>
                        Delivery progress
                      </AppText>
                      <AppText variant="caption" style={styles.progressValue}>
                        {progress}%
                      </AppText>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Button
                      label={simulating ? 'On the way...' : progress >= 100 ? 'Arrived' : 'Simulate ride'}
                      disabled={simulating || progress >= 100}
                      onPress={() => setSimulating(true)}
                    />
                    <Button
                      label="Confirm delivered"
                      variant="secondary"
                      disabled={progress < 100}
                      loading={busy}
                      onPress={() =>
                        void run(
                          () => updateOrderStatus(active.id, 'delivered'),
                          'Could not complete delivery',
                        )
                      }
                    />
                  </>
                )}
              </View>
            )
          ) : null}

          {tab === 'jobs' ? (
            jobs.length === 0 ? (
              <AppText muted style={styles.empty}>
                No pending orders ready for delivery. Awaiting kitchen prep.
              </AppText>
            ) : (
              jobs.map((job) => (
                <View key={job.id} style={styles.card}>
                  <View style={styles.row}>
                    <AppText style={styles.strong}>{job.restaurantName}</AppText>
                    <AppText style={styles.strong}>ETB {job.deliveryFee}</AppText>
                  </View>
                  <AppText variant="caption" muted>
                    Pickup: {job.restaurantAddress ?? job.restaurantName}
                  </AppText>
                  <AppText variant="caption" muted>
                    Deliver to: {job.deliveryAddress}
                  </AppText>
                  <AppText muted>
                    {job.customerName ?? 'Customer'} · ETB {job.totalAmount}
                  </AppText>
                  <Button
                    label={active ? 'Finish current delivery first' : 'Accept delivery'}
                    disabled={Boolean(active)}
                    loading={busy}
                    onPress={() =>
                      void run(async () => {
                        await acceptJob(job.id);
                        setTab('route');
                      }, 'Could not accept job')
                    }
                  />
                </View>
              ))
            )
          ) : null}

          {tab === 'history' ? (
            history.orders.length === 0 ? (
              <AppText muted style={styles.empty}>
                No completed deliveries yet.
              </AppText>
            ) : (
              <>
                <AppText muted>
                  {history.totalDeliveries} deliveries · {history.totalEarnings} ETB earned
                </AppText>
                {history.orders.map((order) => (
                  <View key={order.id} style={styles.card}>
                    <View style={styles.row}>
                      <AppText style={styles.strong}>{order.restaurantName}</AppText>
                      <AppText>ETB {order.deliveryFee}</AppText>
                    </View>
                    <AppText variant="caption" muted>
                      {order.deliveryAddress}
                    </AppText>
                  </View>
                ))}
              </>
            )
          ) : null}
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
    textTransform: 'capitalize',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
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
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
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
  strong: {
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  items: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    color: colors.primary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
