import { type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { AppText } from './AppText';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightSlot?: ReactNode;
};

export function TextField({ label, error, rightSlot, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption">{label}</AppText>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...props}
        />
        {rightSlot}
      </View>
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
