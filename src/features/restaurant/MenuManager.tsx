import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { addMenuItem, deleteMenuItem, updateMenuItem } from '@/api/restaurants';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components';
import { pickImageFromLibrary } from '@/media/pickImage';
import { colors, spacing } from '@/theme';
import type { MenuItem, PickedImage, Restaurant } from '@/types';

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
  const [image, setImage] = useState<PickedImage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [priceError, setPriceError] = useState<string | undefined>();

  const resetForm = () => {
    setItemName('');
    setPrice('');
    setDescription('');
    setImage(null);
    setEditingId(null);
  };

  const fillItem = (item: MenuItem) => {
    setEditingId(item.id);
    setItemName(item.itemName);
    setPrice(String(item.price));
    setDescription(item.description);
    setCategory(item.category);
    setImage(null);
  };

  const handleSave = async () => {
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
      const payload = {
        itemName: itemName.trim(),
        price: parsedPrice,
        description: description.trim(),
        category,
        image,
      };
      const updated = editingId
        ? await updateMenuItem({ ...payload, itemId: editingId })
        : await addMenuItem(payload);
      onRestaurantChange(updated);
      resetForm();
    } catch (error) {
      Alert.alert(editingId ? 'Could not update item' : 'Could not add item', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePick = async () => {
    try {
      const picked = await pickImageFromLibrary();
      if (picked) {
        setImage(picked);
      }
    } catch (error) {
      Alert.alert('Could not open photos', error instanceof Error ? error.message : 'Permission denied');
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
      <Button label={image ? 'Photo selected' : 'Add food photo'} variant="secondary" onPress={() => void handlePick()} />
      <Button label={editingId ? 'Save changes' : 'Add food item'} loading={saving} onPress={() => void handleSave()} />
      {editingId ? <Button label="Cancel edit" variant="secondary" onPress={resetForm} /> : null}

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
              <View style={styles.itemActions}>
                <Pressable onPress={() => fillItem(item)}>
                  <AppText variant="caption" style={styles.edit}>
                    Edit
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert('Remove this dish?', item.itemName, [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          void deleteMenuItem(item.id)
                            .then(onRestaurantChange)
                            .catch((error) => Alert.alert('Could not delete', getApiErrorMessage(error)));
                        },
                      },
                    ])
                  }
                >
                  <AppText variant="caption" style={styles.cancel}>
                    Delete
                  </AppText>
                </Pressable>
              </View>
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
  itemActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  edit: {
    color: colors.primary,
    fontWeight: '600',
  },
  cancel: {
    color: colors.danger,
    fontWeight: '600',
  },
});
