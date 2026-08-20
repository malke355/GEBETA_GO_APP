import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfileRequest } from '@/api/auth';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components';
import { PHONE_PATTERN } from '@/config';
import { useAuth } from '@/features/auth';
import { LANGUAGE_LABELS, LANGUAGES, useLanguage } from '@/i18n';
import { routes } from '@/navigation';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateSession } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    if (phone && !PHONE_PATTERN.test(phone)) {
      Alert.alert('Invalid phone', 'Phone must be +2519 followed by 8 digits.');
      return;
    }
    setSaving(true);
    try {
      updateSession(await updateProfileRequest({ name: name.trim(), phone, address: address.trim() }));
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.app))} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="title">{t.profile}</AppText>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="caption">{t.language}</AppText>
        <View style={styles.row}>
          {LANGUAGES.map((option) => (
            <Pressable
              key={option}
              onPress={() => setLanguage(option)}
              style={[styles.chip, language === option && styles.chipActive]}
            >
              <AppText style={language === option ? styles.chipLabelActive : styles.chipLabel}>
                {LANGUAGE_LABELS[option]}
              </AppText>
            </Pressable>
          ))}
        </View>
        <TextField label={t.fullName} value={name} onChangeText={setName} />
        <TextField label={t.phoneNumber} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label={t.deliveryAddress} value={address} onChangeText={setAddress} />
        <Button label={t.save} loading={saving} onPress={() => void handleSave()} />
        <Pressable onPress={() => router.push(routes.about as Href)}>
          <AppText muted>{t.about}</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
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
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  chipLabel: {
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
