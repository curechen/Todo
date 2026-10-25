import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRIORITY_OPTIONS, type Priority } from '@/lib/priority';
import { colors, priorityColors, radius, spacing, typography } from '@/theme';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          优先级<Text style={styles.required}> *</Text>
        </Text>
        <Text style={styles.hint}>P1 最高，P4 最低</Text>
      </View>

      <View style={styles.options}>
        {PRIORITY_OPTIONS.map((option) => {
          const selected = option.value === value;
          const color = priorityColors[option.value];

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && { borderColor: color, backgroundColor: `${color}14` },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionLabel, selected && { color }]}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  optionDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});
