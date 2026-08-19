import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';
import type { MenuItem } from '@/types';

type MenuItemCardProps = {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function MenuItemCard({ item, quantity, onAdd, onIncrement, onDecrement }: MenuItemCardProps) {
  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <AppText style={styles.name}>{item.itemName}</AppText>
        {item.description ? (
          <AppText variant="caption" muted numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
        <AppText style={styles.price}>ETB {item.price}</AppText>
        {quantity > 0 ? (
          <View style={styles.stepper}>
            <Pressable onPress={onDecrement} style={styles.stepButton} accessibilityLabel="Decrease quantity">
              <Ionicons name="remove" size={16} color={colors.text} />
            </Pressable>
            <AppText>{quantity}</AppText>
            <Pressable onPress={onIncrement} style={styles.stepButton} accessibilityLabel="Increase quantity">
              <Ionicons name="add" size={16} color={colors.text} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onAdd} style={styles.addButton} accessibilityRole="button">
            <AppText style={styles.addLabel}>Add</AppText>
          </Pressable>
        )}
      </View>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
  addButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
});
