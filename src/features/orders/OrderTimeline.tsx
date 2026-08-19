import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';
import type { OrderStatus } from '@/types';
import { TRACK_STEPS, timelineStatus } from './orderStatus';

type OrderTimelineProps = {
  status: OrderStatus;
};

export function OrderTimeline({ status }: OrderTimelineProps) {
  const current = timelineStatus(status);
  const currentIndex =
    current === 'cancelled' ? -1 : TRACK_STEPS.findIndex((step) => step.key === current);

  return (
    <View style={styles.list}>
      {TRACK_STEPS.map((step, index) => {
        const isCompleted = currentIndex > index || current === 'delivered';
        const isActive = currentIndex === index && current !== 'delivered';

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isActive && styles.dotActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryContrast} />
                ) : (
                  <AppText style={[styles.index, isActive && styles.indexActive]}>{index + 1}</AppText>
                )}
              </View>
              {index < TRACK_STEPS.length - 1 ? (
                <View style={[styles.line, isCompleted && styles.lineCompleted]} />
              ) : null}
            </View>
            <View style={styles.copy}>
              <AppText style={isActive ? styles.labelActive : undefined}>{step.label}</AppText>
              <AppText variant="caption" muted>
                {step.description}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  dotCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  index: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  indexActive: {
    color: colors.primary,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  copy: {
    flex: 1,
    paddingBottom: spacing.md,
    gap: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
