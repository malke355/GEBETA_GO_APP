import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createOrder } from '@/api/orders';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components';
import { DEFAULT_DELIVERY_COORDS } from '@/config';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';
import type { PaymentMethod } from '@/types';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'cash', label: 'Cash on delivery', hint: 'Pay the rider when your food arrives.' },
  { id: 'telebirr', label: 'Telebirr', hint: 'Pay with Telebirr after the order is placed.' },
  { id: 'bank_transfer', label: 'Bank transfer', hint: 'Transfer to the restaurant after placing the order.' },
];

export function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { items, restaurant, subtotal, deliveryFee, totalAmount, clearCart } = useCart();
  const [address, setAddress] = useState(user?.address ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankName, setBankName] = useState('');
  const [addressError, setAddressError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  if (!restaurant || items.length === 0) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <AppText muted>Your cart is empty.</AppText>
        <Button label="Back to cart" onPress={() => router.replace(routes.cart)} />
      </View>
    );
  }

  const selectedPayment = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setAddressError('Delivery address is required');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items,
        deliveryAddress: address.trim(),
        paymentMethod,
        lat: DEFAULT_DELIVERY_COORDS.lat,
        lng: DEFAULT_DELIVERY_COORDS.lng,
        bankName: paymentMethod === 'bank_transfer' ? bankName.trim() : undefined,
        subtotal,
        deliveryFee,
        totalAmount,
      });
      clearCart();
      router.replace(routes.order(order.id) as Href);
    } catch (error) {
      Alert.alert('Could not place order', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="title">Checkout</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText muted>From {restaurant.name}</AppText>

          <TextField
            label="Delivery address"
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setAddressError(undefined);
            }}
            placeholder="Bole Atlas, Addis Ababa"
            multiline
            textAlignVertical="top"
            style={styles.addressInput}
            error={addressError}
          />

          <AppText variant="caption">Payment method</AppText>
          <View style={styles.methods}>
            {PAYMENT_OPTIONS.map((option) => {
              const selected = option.id === paymentMethod;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setPaymentMethod(option.id)}
                  style={[styles.method, selected && styles.methodSelected]}
                >
                  <AppText style={selected ? styles.methodLabelSelected : styles.methodLabel}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {selectedPayment ? (
            <AppText variant="caption" muted>
              {selectedPayment.hint}
            </AppText>
          ) : null}

          {paymentMethod === 'bank_transfer' ? (
            <TextField
              label="Bank name (optional)"
              value={bankName}
              onChangeText={setBankName}
              placeholder="CBE, Awash, ..."
            />
          ) : null}

          <View style={styles.summary}>
            {items.map((line) => (
              <View key={line.menuItemId} style={styles.summaryRow}>
                <AppText muted>
                  {line.quantity}× {line.itemName}
                </AppText>
                <AppText>ETB {line.price * line.quantity}</AppText>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <AppText muted>Delivery</AppText>
              <AppText>ETB {deliveryFee}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.total}>Total</AppText>
              <AppText style={styles.total}>ETB {totalAmount}</AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label={`Place order · ETB ${totalAmount}`} loading={submitting} onPress={() => void handlePlaceOrder()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  methods: {
    gap: spacing.sm,
  },
  method: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  methodSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  addressInput: {
    minHeight: 72,
  },
  methodLabel: {
    color: colors.text,
  },
  methodLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  summary: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  total: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
