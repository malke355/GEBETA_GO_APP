import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';
import type { MenuItem } from '@/types';

type MenuItemCardProps = {
  item: MenuItem;
};

export function MenuItemCard({ item }: MenuItemCardProps) {
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
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
});
