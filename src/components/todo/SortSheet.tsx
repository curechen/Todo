import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { SORT_OPTIONS, type SortMode } from '@/lib/sort';
import { colors, radius, spacing, typography } from '@/theme';

interface SortSheetProps {
  visible: boolean;
  onClose: () => void;
  sortMode: SortMode;
  onSelect: (mode: SortMode) => void;
}

export function SortSheet({ visible, onClose, sortMode, onSelect }: SortSheetProps) {
  return (
    <Sheet onClose={onClose} title="排序方式" visible={visible}>
      <View style={styles.content}>
        {SORT_OPTIONS.map((option) => {
          const selected = option.value === sortMode;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
              </Text>
              {selected ? <Check color={colors.primary} size={20} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
