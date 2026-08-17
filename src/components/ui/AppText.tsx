import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, typography, type TypographyVariant } from '@/theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  muted?: boolean;
};

export function AppText({ variant = 'body', muted = false, style, ...props }: AppTextProps) {
  return (
    <Text
      style={[styles.base, typography[variant], muted && styles.muted, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
});
