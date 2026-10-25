import { Check } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { getTypeIcon, TYPE_ICON_OPTIONS } from '@/lib/type-icons';
import { colors, spacing, typography } from '@/theme';

interface IconPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPickerSheet({
  visible,
  onClose,
  selectedIcon,
  onSelect,
}: IconPickerSheetProps) {
  return (
    <Sheet onClose={onClose} title="选择图标" visible={visible}>
      <FlatList
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        data={TYPE_ICON_OPTIONS}
        keyExtractor={(item) => item.key}
        numColumns={4}
        renderItem={({ item }) => {
          const Icon = getTypeIcon(item.key);
          const selected = item.key === selectedIcon;

          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(item.key);
                onClose();
              }}
              style={({ pressed }) => [
                styles.item,
                selected && styles.itemSelected,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
                <Icon
                  color={selected ? colors.primary : colors.textSecondary}
                  size={22}
                  strokeWidth={2}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {item.label}
              </Text>
              {selected ? (
                <Check color={colors.primary} size={13} strokeWidth={2.6} style={styles.check} />
              ) : null}
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 440,
  },
  content: {
    paddingBottom: spacing.sm,
  },
  column: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.white,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
