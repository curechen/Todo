import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { IconComponent } from './types';

interface ActionRowProps {
  icon: IconComponent;
  title: string;
  description?: string;
  onPress: () => void;
  isLast?: boolean;
}

export function ActionRow({ icon: Icon, title, description, onPress, isLast }: ActionRowProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Icon color={colors.primary} size={20} strokeWidth={1.9} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <ChevronRight color={colors.textMuted} size={20} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
