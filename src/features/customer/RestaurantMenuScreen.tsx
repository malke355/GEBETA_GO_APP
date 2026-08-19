import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components';
import { colors, spacing } from '@/theme';
import type { MenuItem, Restaurant } from '@/types';
import { MenuItemCard } from './MenuItemCard';
import { useRestaurant } from './useRestaurant';

const ALL_CATEGORIES = 'All';

type RestaurantMenuScreenProps = {
  restaurantId: string;
  onBack: () => void;
};

function RestaurantHeader({ restaurant, onBack }: { restaurant: Restaurant; onBack: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <View style={styles.hero}>
        <Image source={{ uri: restaurant.imageUrl }} style={styles.heroImage} />
        <Pressable
          onPress={onBack}
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.details}>
        <AppText variant="title">{restaurant.name}</AppText>
        <AppText muted>
          {restaurant.cuisineType} · {restaurant.location.address}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="star" size={14} color={colors.primary} />
            <AppText variant="caption">
              {restaurant.rating.toFixed(1)} ({restaurant.ratingCount})
            </AppText>
          </View>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" muted>
              {restaurant.deliveryTime} min
            </AppText>
          </View>
          <View style={styles.meta}>
            <Ionicons name="bicycle-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" muted>
              ETB {restaurant.deliveryFee} delivery
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

export function RestaurantMenuScreen({ restaurantId, onBack }: RestaurantMenuScreenProps) {
  const { restaurant, loading, error, refresh } = useRestaurant(restaurantId);
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(() => {
    if (!restaurant) {
      return [ALL_CATEGORIES];
    }
    return [ALL_CATEGORIES, ...new Set(restaurant.menu.map((item) => item.category))];
  }, [restaurant]);

  const visibleItems = useMemo(() => {
    if (!restaurant) {
      return [];
    }
    if (category === ALL_CATEGORIES) {
      return restaurant.menu;
    }
    return restaurant.menu.filter((item) => item.category === category);
  }, [restaurant, category]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.centered}>
        <AppText muted>{error ?? 'Restaurant not found'}</AppText>
        <Button label="Go back" variant="secondary" onPress={onBack} />
        <Button label="Try again" onPress={() => void refresh()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: MenuItem }) => (
          <View style={styles.itemWrap}>
            <MenuItemCard item={item} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <RestaurantHeader restaurant={restaurant} onBack={onBack} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {categories.map((option) => {
                const selected = option === category;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
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
        ListEmptyComponent={
          <AppText muted style={styles.empty}>
            No dishes in this category.
          </AppText>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 200,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  itemWrap: {
    paddingHorizontal: spacing.lg,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
