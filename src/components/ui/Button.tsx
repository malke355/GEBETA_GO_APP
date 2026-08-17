import { forwardRef } from 'react';
import { Pressable, StyleSheet, type PressableProps, type View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  { label, variant = 'primary', disabled, style, ...props },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <AppText style={variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel}>
        {label}
      </AppText>
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
