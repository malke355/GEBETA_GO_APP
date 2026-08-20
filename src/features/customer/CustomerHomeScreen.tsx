import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { toggleFavoriteRequest } from '@/api/auth';
import { listMyOrders } from '@/api/orders';
import { AppText, Button } from '@/components';
import { CartBar, useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { OFFERS } from '@/features/offers/offers';
import { isActiveOrderStatus, statusHeadline } from '@/features/orders';
import { useLanguage } from '@/i18n';
import { routes } from '@/navigation';
import { colors, spacing, typography } from '@/theme';
import type { Order, Restaurant } from '@/types';
import { RestaurantCard } from './RestaurantCard';
import { useRestaurants } from './useRestaurants';

const ALL_CUISINES = 'All';

function matchesQuery(restaurant: Restaurant, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    restaurant.name,
    restaurant.cuisineType,
    restaurant.city,
    restaurant.location.address,
    ...restaurant.menu.map((item) => item.itemName),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

type CustomerHomeScreenProps = {
  customerName: string;
  onLogout: () => void;
};

export function CustomerHomeScreen({ customerName, onLogout }: CustomerHomeScreenProps) {
  const router = useRouter();
  const { user, updateSession } = useAuth();
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const { restaurants, loading, error, refresh } = useRestaurants();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState(ALL_CUISINES);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadActiveOrder = async () => {
        try {
          const orders = await listMyOrders();
          if (!cancelled) {
            setActiveOrder(orders.find((order) => isActiveOrderStatus(order.status)) ?? null);
          }
        } catch {
          if (!cancelled) {
            setActiveOrder(null);
          }
        }
      };

      void loadActiveOrder();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const cuisines = useMemo(() => {
    const unique = [...new Set(restaurants.map((restaurant) => restaurant.cuisineType))];
    return [ALL_CUISINES, ...unique];
  }, [restaurants]);

  const visibleRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const cuisineMatch = cuisine === ALL_CUISINES || restaurant.cuisineType === cuisine;
      const favoriteMatch =
        !favoritesOnly || (user?.favoriteIds ?? []).includes(restaurant.id);
      return cuisineMatch && favoriteMatch && matchesQuery(restaurant, normalizedQuery);
    });
  }, [restaurants, cuisine, query, favoritesOnly, user?.favoriteIds]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" muted>
            Delivering in Addis Ababa
          </AppText>
          <AppText variant="title">Hi, {customerName.split(' ')[0] ?? customerName}</AppText>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push(routes.profile as Href)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.profile}>
            <Ionicons name="person-circle-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push(routes.orders)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open orders"
          >
            <Ionicons name="receipt-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push(routes.cart)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open cart"
          >
            <Ionicons name="cart-outline" size={24} color={colors.text} />
            {itemCount > 0 ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{itemCount}</AppText>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={onLogout} hitSlop={8} accessibilityRole="button" accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {activeOrder ? (
        <Pressable
          onPress={() => router.push(routes.order(activeOrder.id) as Href)}
          style={styles.trackBanner}
        >
          <View style={styles.trackCopy}>
            <AppText style={styles.trackTitle}>Track your {activeOrder.restaurantName} order</AppText>
            <AppText variant="caption" muted>
              {statusHeadline(activeOrder.status)}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {loading && restaurants.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText muted>{error}</AppText>
          <Button label="Try again" onPress={() => void refresh()} />
        </View>
      ) : (
        <FlatList
          data={visibleRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              favorited={(user?.favoriteIds ?? []).includes(item.id)}
              onToggleFavorite={() => {
                void toggleFavoriteRequest(item.id)
                  .then(updateSession)
                  .catch(() => undefined);
              }}
              onPress={() => router.push(routes.restaurant(item.id) as Href)}
            />
          )}
          contentContainerStyle={[styles.list, itemCount > 0 && styles.listWithCart]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offers}>
                {OFFERS.map((offer) => (
                  <Pressable key={offer.id} onPress={() => router.push(routes.about as Href)} style={styles.offerCard}>
                    <AppText style={styles.offerTitle}>{offer.title}</AppText>
                    <AppText variant="caption" muted numberOfLines={2}>
                      {offer.detail}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable onPress={() => setFavoritesOnly((current) => !current)} style={styles.favoriteToggle}>
                <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={16} color={colors.primary} />
                <AppText variant="caption" style={styles.favoriteToggleText}>
                  {favoritesOnly ? t.favorites : t.favorites}
                </AppText>
              </Pressable>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
              {cuisines.map((option) => {
                const selected = option === cuisine;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCuisine(option)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <AppText style={selected ? styles.chipLabelSelected : styles.chipLabel}>
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <AppText muted style={styles.empty}>
              No restaurants match that search.
            </AppText>
          }
        />
      )}
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.primaryContrast,
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.sm,
  },
  chips: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  chipLabel: {
    color: colors.textMuted,
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  listWithCart: {
    paddingBottom: 120,
  },
  separator: {
    height: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  offers: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  offerCard: {
    width: 220,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
  },
  offerTitle: {
    fontWeight: '700',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  favoriteToggleText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
