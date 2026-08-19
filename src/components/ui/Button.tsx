import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  { label, variant = 'primary', disabled, loading = false, style, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryContrast : colors.text} />
      ) : (
        <AppText style={variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryLabel: {
    color: colors.primaryContrast,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: colors.text,
    fontWeight: '600',
  },
});
