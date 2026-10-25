import { useRouter } from 'expo-router';
import {
  ArrowUpDown,
  CalendarDays,
  Inbox,
  SearchX,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { FilterSheet } from '@/components/todo/FilterSheet';
import { SortSheet } from '@/components/todo/SortSheet';
import { SwipeableTodoRow } from '@/components/todo/SwipeableTodoRow';
import { TypePickerSheet } from '@/components/todo/TypePickerSheet';
import {
  completeTodo,
  deleteTodos,
  restoreTodos,
  type TodoListItem,
} from '@/db';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePendingTodos } from '@/hooks/use-pending-todos';
import { useTypes } from '@/hooks/use-types';
import { PRIORITY_SHORT } from '@/lib/priority';
import { getSortShortLabel } from '@/lib/sort';
import { findTypeName } from '@/lib/type-tree';
import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';
import { useHighlightStore } from '@/stores/highlight';
import { useSettingsStore } from '@/stores/settings';
import { useToastStore } from '@/stores/toast';
import { useUndoStore } from '@/stores/undo';
import { colors, layout, radius, spacing, typography } from '@/theme';

export default function PendingScreen() {
  const router = useRouter();
  const filters = useFilterStore((state) => state.pending);
  const updateFilters = useFilterStore((state) => state.update);
  const clearFilters = useFilterStore((state) => state.clear);
  const sortMode = useSettingsStore((state) => state.sortMode);
  const setSortMode = useSettingsStore((state) => state.setSortMode);
  const { types } = useTypes();
  const bump = useDataVersion((state) => state.bump);
  const undo = useUndoStore();
  const toast = useToastStore();
  const highlightId = useHighlightStore((state) => state.todoId);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedKeyword = useDebouncedValue(filters.keyword, 250);
  const { items, loading } = usePendingTodos(
    { ...filters, keyword: debouncedKeyword },
    sortMode
  );

  const listRef = useRef<FlatList<TodoListItem>>(null);

  const selectedTypeName = findTypeName(types, filters.typeId);
  const activeFilterCount =
    (filters.typeId ? 1 : 0) +
    (filters.priorities.length > 0 ? 1 : 0) +
    (filters.overdueOnly ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    if (!selectionMode) return;

    const visibleIds = new Set(items.map((item) => item.id));
    const next = selectedIds.filter((id) => visibleIds.has(id));

    if (next.length !== selectedIds.length) {
      setSelectedIds(next);
      if (next.length === 0) setSelectionMode(false);
    }
  }, [items, selectionMode, selectedIds]);

  useEffect(() => {
    if (!highlightId || items.length === 0) return;

    const index = items.findIndex((item) => item.id === highlightId);
    if (index < 0) return;

    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.15 });
    }, 100);

    return () => clearTimeout(timer);
  }, [highlightId, items]);

  const startSelection = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        const next = current.filter((item) => item !== id);
        if (next.length === 0) setSelectionMode(false);
        return next;
      }
      return [...current, id];
    });
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const openDetail = (item: TodoListItem) => {
    router.push({ pathname: '/todo/[id]', params: { id: item.id, from: 'pending' } });
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTodo(id);
      bump();
    } catch {
      toast.show({ message: '操作失败，请重试' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      const snapshots = await deleteTodos(selectedIds);
      cancelSelection();
      bump();
      undo.show({
        message: `已删除 ${snapshots.length} 条待办`,
        restore: () => restoreTodos(snapshots),
      });
    } catch {
      toast.show({ message: '删除失败，请重试' });
    }
  };

  const confirmDelete = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      '删除待办',
      `确定删除选中的 ${selectedIds.length} 条待办？删除后 5 秒内可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            void handleDeleteSelected();
          },
        },
      ]
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (hasActiveFilters || filters.keyword) {
      return (
        <EmptyState
          actionLabel="清除筛选"
          description="试试调整关键词或筛选条件"
          icon={SearchX}
          onAction={() => clearFilters('pending')}
          title="没有符合条件的待办"
        />
      );
    }

    return (
      <EmptyState
        description="点击右下角 + 新建第一条待办"
        icon={Inbox}
        title="还没有待办"
      />
    );
  };

  return (
    <Screen>
      <PageHeader
        onBack={undefined}
        right={
          <IconButton
            accessibilityLabel="打开日历"
            icon={CalendarDays}
            onPress={() => router.push('/calendar')}
          />
        }
        subtitle={loading ? undefined : `${items.length} 项`}
        title="待完成"
      />

      <View style={styles.body}>
        <View style={styles.searchRow}>
          <SearchBar
            onChangeText={(keyword) => updateFilters('pending', { keyword })}
            value={filters.keyword}
          />
        </View>

        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSortSheetOpen(true)}
            style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
            <ArrowUpDown color={colors.textSecondary} size={15} strokeWidth={2} />
            <Text style={styles.toolText}>{getSortShortLabel(sortMode)}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterSheetOpen(true)}
            style={({ pressed }) => [
              styles.toolButton,
              activeFilterCount > 0 && styles.toolButtonActive,
              pressed && styles.pressed,
            ]}>
            <SlidersHorizontal
              color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
              size={16}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.toolText,
                activeFilterCount > 0 && styles.toolTextActive,
              ]}>
              筛选
            </Text>
            {activeFilterCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {hasActiveFilters ? (
          <View style={styles.activeFilters}>
            {filters.typeId && selectedTypeName ? (
              <Chip
                label={`类型：${selectedTypeName}`}
                onPress={() => updateFilters('pending', { typeId: null })}
                selected
              />
            ) : null}
            {filters.priorities.length > 0 ? (
              <Chip
                label={`优先级：${filters.priorities
                  .map((priority) => PRIORITY_SHORT[priority])
                  .join('、')}`}
                onPress={() => updateFilters('pending', { priorities: [] })}
                selected
              />
            ) : null}
            {filters.overdueOnly ? (
              <Chip
                label="只看逾期"
                onPress={() => updateFilters('pending', { overdueOnly: false })}
                selected
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => clearFilters('pending')}
              style={styles.clearFilters}>
              <Text style={styles.clearFiltersText}>清除</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listContentEmpty,
            { paddingBottom: selectionMode ? spacing.lg : 120 },
          ]}
          data={items}
          extraData={`${selectionMode}-${selectedIds.join(',')}-${highlightId ?? ''}`}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty()}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              animated: true,
              offset: info.averageItemLength * info.index,
            });
          }}
          renderItem={({ item }) => (
            <SwipeableTodoRow
              highlighted={highlightId === item.id}
              onLongPress={() =>
                selectionMode ? toggleSelection(item.id) : startSelection(item.id)
              }
              onPress={() =>
                selectionMode ? toggleSelection(item.id) : openDetail(item)
              }
              onSwipe={() => void handleComplete(item.id)}
              selected={selectedIds.includes(item.id)}
              selectionMode={selectionMode}
              swipeEnabled={!selectionMode}
              swipeTone="complete"
              todo={item}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />

        {selectionMode ? (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>已选 {selectedIds.length} 条</Text>
            <Pressable
              accessibilityRole="button"
              onPress={cancelSelection}
              style={({ pressed }) => [styles.selectionCancel, pressed && styles.pressed]}>
              <Text style={styles.selectionCancelText}>取消</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={selectedIds.length === 0}
              onPress={confirmDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                selectedIds.length === 0 && styles.deleteButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Trash2 color={colors.white} size={16} strokeWidth={2.2} />
              <Text style={styles.deleteText}>删除</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!selectionMode ? (
        <FloatingActionButton onPress={() => router.push('/todo/new')} />
      ) : null}

      <FilterSheet
        onClose={() => setFilterSheetOpen(false)}
        onOpenTypePicker={() => {
          setFilterSheetOpen(false);
          setTypePickerOpen(true);
        }}
        tab="pending"
        types={types}
        visible={filterSheetOpen}
      />

      <SortSheet
        onClose={() => setSortSheetOpen(false)}
        onSelect={(mode) => {
          void setSortMode(mode);
        }}
        sortMode={sortMode}
        visible={sortSheetOpen}
      />

      <TypePickerSheet
        includeAll
        onClose={() => setTypePickerOpen(false)}
        onSelect={(typeId) => updateFilters('pending', { typeId })}
        selectedId={filters.typeId}
        title="筛选类型"
        types={types}
        visible={typePickerOpen}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  toolButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  toolText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toolTextActive: {
    color: colors.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.white,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
  },
  clearFilters: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  clearFiltersText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xs,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  loading: {
    paddingTop: 96,
    alignItems: 'center',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectionText: {
    ...typography.captionStrong,
    color: colors.text,
    flex: 1,
  },
  selectionCancel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectionCancelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteText: {
    ...typography.captionStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.8,
  },
});
