import { useMemo, useState } from 'react';
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
import { useRouter, type Href } from 'expo-router';
import { AppText, Button } from '@/components';
import { CartBar, useCart } from '@/features/cart';
import { routes } from '@/navigation';
import { colors, spacing, typography } from '@/theme';
import type { Restaurant } from '@/types';
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
  const { itemCount } = useCart();
  const { restaurants, loading, error, refresh } = useRestaurants();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState(ALL_CUISINES);

  const cuisines = useMemo(() => {
    const unique = [...new Set(restaurants.map((restaurant) => restaurant.cuisineType))];
    return [ALL_CUISINES, ...unique];
  }, [restaurants]);

  const visibleRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const cuisineMatch = cuisine === ALL_CUISINES || restaurant.cuisineType === cuisine;
      return cuisineMatch && matchesQuery(restaurant, normalizedQuery);
    });
  }, [restaurants, cuisine, query]);

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

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search restaurants or dishes"
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
              onPress={() => router.push(routes.restaurant(item.id) as Href)}
            />
          )}
          contentContainerStyle={[styles.list, itemCount > 0 && styles.listWithCart]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
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
});
