import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';
import type { Restaurant } from '@/types';

type RestaurantCardProps = {
  restaurant: Restaurant;
  onPress: () => void;
  favorited?: boolean;
  onToggleFavorite?: () => void;
};

export function RestaurantCard({ restaurant, onPress, favorited, onToggleFavorite }: RestaurantCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        <Image source={{ uri: restaurant.imageUrl }} style={styles.image} />
        {onToggleFavorite ? (
          <Pressable onPress={onToggleFavorite} style={styles.heart} hitSlop={8}>
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText variant="body" style={styles.name}>
          {restaurant.name}
        </AppText>
        <AppText variant="caption" muted>
          {restaurant.cuisineType} · {restaurant.city}
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
              ETB {restaurant.deliveryFee}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" muted numberOfLines={1}>
          {restaurant.location.address}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    width: '100%',
    height: 148,
    backgroundColor: colors.surface,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '700',
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
});
