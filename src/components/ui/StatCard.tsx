import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string;
}

export function StatCard({ label, value, accent = colors.text }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text numberOfLines={1} style={[styles.value, { color: accent }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  value: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
});
