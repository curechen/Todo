import { Check, Folder, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import type { TypeRow } from '@/db/schema';
import { getTypeIcon } from '@/lib/type-icons';
import { buildTypeTree, flattenTypeTree } from '@/lib/type-tree';
import { colors, spacing, typography } from '@/theme';

interface TypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  types: TypeRow[];
  selectedId: string | null;
  onSelect: (typeId: string | null) => void;
  includeAll?: boolean;
  allLabel?: string;
  title?: string;
  allowCreate?: boolean;
  onCreateRequest?: () => void;
}

export function TypePickerSheet({
  visible,
  onClose,
  types,
  selectedId,
  onSelect,
  includeAll = false,
  allLabel = '全部类型',
  title = '选择类型',
  allowCreate = false,
  onCreateRequest,
}: TypePickerSheetProps) {
  const items = useMemo(() => flattenTypeTree(buildTypeTree(types)), [types]);

  const choose = (typeId: string | null) => {
    onSelect(typeId);
    onClose();
  };

  return (
    <Sheet onClose={onClose} title={title} visible={visible}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>还没有类型</Text>}
        ListFooterComponent={
          allowCreate ? (
            <Pressable
              accessibilityRole="button"
              onPress={onCreateRequest}
              style={({ pressed }) => [styles.createRow, pressed && styles.pressed]}>
              <View style={styles.createIcon}>
                <Plus color={colors.primary} size={17} strokeWidth={2.2} />
              </View>
              <Text style={styles.createText}>新建类型</Text>
            </Pressable>
          ) : undefined
        }
        ListHeaderComponent={
          includeAll ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => choose(null)}
              style={({ pressed }) => [
                styles.row,
                selectedId == null && styles.rowSelected,
                pressed && styles.pressed,
              ]}>
              <View style={styles.icon}>
                <Folder color={colors.primary} size={17} strokeWidth={2} />
              </View>
              <Text style={styles.name}>{allLabel}</Text>
              {selectedId == null ? (
                <Check color={colors.primary} size={18} strokeWidth={2.4} />
              ) : null}
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          const Icon = getTypeIcon(item.icon);

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => choose(item.id)}
              style={({ pressed }) => [
                styles.row,
                { paddingLeft: spacing.md + item.depth * spacing.lg },
                selected && styles.rowSelected,
                pressed && styles.pressed,
              ]}>
              <View style={styles.icon}>
                <Icon color={colors.primary} size={17} strokeWidth={2} />
              </View>
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
              {selected ? <Check color={colors.primary} size={18} strokeWidth={2.4} /> : null}
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
    maxHeight: 480,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  createIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  pressed: {
    opacity: 0.8,
  },
});
