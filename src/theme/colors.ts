export const colors = {
  background: '#FFFFFF',
  surface: '#F6F7F9',
  text: '#111827',
  textMuted: '#6B7280',
  primary: '#111827',
  primaryContrast: '#FFFFFF',
  secondary: '#F3F4F6',
  border: '#E5E7EB',
  danger: '#DC2626',
} as const;

export type ColorName = keyof typeof colors;
