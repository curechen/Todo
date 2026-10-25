import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import type { TypeRow } from '@/db/schema';
import { PRIORITY_OPTIONS, type Priority } from '@/lib/priority';
import { getTypeIcon } from '@/lib/type-icons';
import { useFilterStore, type FilterTab } from '@/stores/filters';
import { colors, radius, spacing, typography } from '@/theme';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  tab: FilterTab;
  types: TypeRow[];
  onOpenTypePicker: () => void;
}

export function FilterSheet({
  visible,
  onClose,
  tab,
  types,
  onOpenTypePicker,
}: FilterSheetProps) {
  const filters = useFilterStore((state) => state[tab]);
  const update = useFilterStore((state) => state.update);
  const clear = useFilterStore((state) => state.clear);

  const selectedType = filters.typeId
    ? types.find((type) => type.id === filters.typeId)
    : undefined;
  const TypeIcon = getTypeIcon(selectedType?.icon);

  const togglePriority = (priority: Priority) => {
    const exists = filters.priorities.includes(priority);
    update(tab, {
      priorities: exists
        ? filters.priorities.filter((item) => item !== priority)
        : [...filters.priorities, priority],
    });
  };

  return (
    <Sheet onClose={onClose} title="筛选" visible={visible}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>类型（含子类型）</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenTypePicker}
            style={({ pressed }) => [styles.typeRow, pressed && styles.pressed]}>
            <View style={styles.typeIcon}>
              <TypeIcon color={selectedType ? colors.primary : colors.textMuted} size={18} />
            </View>
            <Text style={styles.typeText}>
              {selectedType ? selectedType.name : '全部类型'}
            </Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>优先级</Text>
          <View style={styles.chips}>
            {PRIORITY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={`${option.label} ${option.description}`}
                selected={filters.priorities.includes(option.value)}
                onPress={() => togglePriority(option.value)}
              />
            ))}
          </View>
        </View>

        {tab === 'pending' ? (
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>只看逾期</Text>
              <Text style={styles.switchHint}>截止时间已过的待办</Text>
            </View>
            <Switch
              onValueChange={(value) => update(tab, { overdueOnly: value })}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.primary }}
              value={filters.overdueOnly}
            />
          </View>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => clear(tab)}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Text style={styles.clearText}>清空筛选</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneText}>完成</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  switchHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  clearButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  clearText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  doneButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  doneText: {
    ...typography.captionStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.8,
  },
});
