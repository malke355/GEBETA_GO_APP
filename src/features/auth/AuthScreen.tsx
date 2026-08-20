import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiErrorMessage } from '@/api/errors';
import { AppText, Button, Screen, TextField } from '@/components';
import { APP_NAME, PHONE_PATTERN, PHONE_PREFIX, env } from '@/config';
import { LANGUAGE_LABELS, LANGUAGES, useLanguage } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { UserRole } from '@/types';
import { useAuth } from './AuthContext';
import { LOGIN_ROLES, REGISTER_ROLES } from './roles';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
};

export function AuthScreen() {
  const { login, register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const roles = isLogin ? LOGIN_ROLES : REGISTER_ROLES;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone(PHONE_PREFIX);
    setFormError(null);
    setFieldErrors({});
  };

  const handlePhoneChange = (value: string) => {
    const suffix = value.startsWith(PHONE_PREFIX) ? value.slice(PHONE_PREFIX.length) : value.replace(/\D/g, '');
    const next = `${PHONE_PREFIX}${suffix.replace(/\D/g, '').slice(0, 8)}`;
    setPhone(next);
    setFieldErrors((current) => ({ ...current, phone: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!isLogin && !name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (!isLogin && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !PHONE_PATTERN.test(phone)) {
      nextErrors.phone = 'Enter 8 digits after +2519';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        await login({ email: email.trim(), password, role });
        return;
      }

      if (role === 'admin') {
        setFormError('Admin accounts cannot be self-registered');
        return;
      }

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        address: '',
        phone,
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Network connection error. Is the backend running?'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <AppText variant="title">{APP_NAME}</AppText>
            <View style={styles.langRow}>
              {LANGUAGES.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setLanguage(option)}
                  style={[styles.langChip, language === option && styles.langChipActive]}
                >
                  <AppText style={language === option ? styles.langLabelActive : styles.langLabel}>
                    {LANGUAGE_LABELS[option]}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText muted>{isLogin ? t.signInDesc : t.signUpDesc}</AppText>
          </View>

          {formError ? (
            <View style={styles.errorBanner}>
              <AppText style={styles.errorText}>{formError}</AppText>
            </View>
          ) : null}

          <AppText variant="caption">{isLogin ? t.signIn : t.signUp}</AppText>
          <View style={styles.roleGrid}>
            {roles.map((option) => {
              const selected = role === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setRole(option.id)}
                  style={[styles.roleChip, selected && styles.roleChipSelected]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <AppText style={selected ? styles.roleLabelSelected : styles.roleLabel}>
                    {option.id === 'restaurant' ? t.merchant : t[option.id]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {!isLogin ? (
            <>
              <TextField
                label={t.fullName}
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
                autoCapitalize="words"
                error={fieldErrors.name}
              />
              <TextField
                label={t.phoneNumber}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                error={fieldErrors.phone}
              />
            </>
          ) : null}

          <TextField
            label={t.emailAddress}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={fieldErrors.email}
          />

          <TextField
            label={t.password}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={fieldErrors.password}
            rightSlot={
              <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            }
          />

          <Button
            label={isLogin ? t.signIn : t.signUp}
            loading={submitting}
            onPress={() => {
              void handleSubmit();
            }}
          />

          <Pressable
            onPress={() => {
              setIsLogin((current) => !current);
              setRole('customer');
              resetForm();
            }}
          >
            <AppText muted style={styles.switchText}>
              {isLogin ? `${t.noAccount} ${t.registerHere}` : `${t.hasAccount} ${t.loginHere}`}
            </AppText>
          </Pressable>

          {env.useMockApi ? (
            <AppText variant="caption" muted>
              Offline demo mode. Try customer@test.com / password123
            </AppText>
          ) : (
            <AppText variant="caption" muted>
              Live API. Start npm run server, then try customer@test.com / password123
            </AppText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  langLabel: {
    color: colors.textMuted,
  },
  langLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleChip: {
    width: '48%',
    flexGrow: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  roleChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  roleLabel: {
    color: colors.textMuted,
  },
  roleLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  switchText: {
    textAlign: 'center',
  },
});
