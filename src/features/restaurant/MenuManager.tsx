import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { addMenuItem } from '@/api/restaurants';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components';
import { colors, spacing } from '@/theme';
import type { Restaurant } from '@/types';

const CATEGORIES = ['Ethiopian', 'Burger', 'Pizza', 'Chicken', 'Healthy', 'Pasta', 'Sushi', 'Drinks', 'Desserts'];

type MenuManagerProps = {
  restaurant: Restaurant;
  onRestaurantChange: (restaurant: Restaurant) => void;
};

export function MenuManager({ restaurant, onRestaurantChange }: MenuManagerProps) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ethiopian');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [priceError, setPriceError] = useState<string | undefined>();

  const handleAdd = async () => {
    const parsedPrice = Number(price);
    const nextNameError = itemName.trim() ? undefined : 'Food name is required';
    const nextPriceError =
      Number.isFinite(parsedPrice) && parsedPrice > 0 ? undefined : 'Enter a valid price';
    setNameError(nextNameError);
    setPriceError(nextPriceError);
    if (nextNameError || nextPriceError) {
      return;
    }

    setSaving(true);
    try {
      const updated = await addMenuItem({
        itemName: itemName.trim(),
        price: parsedPrice,
        description: description.trim(),
        category,
      });
      onRestaurantChange(updated);
      setItemName('');
      setPrice('');
      setDescription('');
    } catch (error) {
      Alert.alert('Could not add item', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="title">Menu</AppText>
      <TextField
        label="Food name"
        value={itemName}
        onChangeText={(value) => {
          setItemName(value);
          setNameError(undefined);
        }}
        placeholder="Special Kitfo"
        error={nameError}
      />
      <TextField
        label="Price (ETB)"
        value={price}
        onChangeText={(value) => {
          setPrice(value);
          setPriceError(undefined);
        }}
        placeholder="250"
        keyboardType="numeric"
        error={priceError}
      />
      <AppText variant="caption">Category</AppText>
      <View style={styles.chips}>
        {CATEGORIES.map((option) => {
          const selected = option === category;
          return (
            <Pressable
              key={option}
              onPress={() => setCategory(option)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <AppText style={selected ? styles.chipLabelSelected : styles.chipLabel}>{option}</AppText>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the dish"
        multiline
        textAlignVertical="top"
        style={styles.description}
      />
      <Button label="Add food item" loading={saving} onPress={() => void handleAdd()} />

      {restaurant.menu.length === 0 ? (
        <AppText muted>No menu items yet.</AppText>
      ) : (
        restaurant.menu.map((item) => (
          <View key={item.id} style={styles.item}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : null}
            <View style={styles.itemBody}>
              <AppText style={styles.itemName}>{item.itemName}</AppText>
              <AppText variant="caption" muted>
                {item.category}
              </AppText>
            </View>
            <AppText style={styles.itemPrice}>ETB {item.price}</AppText>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  description: {
    minHeight: 64,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontWeight: '600',
  },
  itemPrice: {
    fontWeight: '700',
  },
});
