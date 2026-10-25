import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CheckCircle2,
  SearchX,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';

import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterSheet } from '@/components/todo/FilterSheet';
import { SwipeableTodoRow } from '@/components/todo/SwipeableTodoRow';
import { TypePickerSheet } from '@/components/todo/TypePickerSheet';
import {
  deleteTodos,
  restoreTodos,
  uncompleteTodo,
  type TodoListItem,
} from '@/db';
import { useCompletedTodos } from '@/hooks/use-completed-todos';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTypes } from '@/hooks/use-types';
import { PRIORITY_SHORT } from '@/lib/priority';
import { findTypeName } from '@/lib/type-tree';
import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';
import { useHighlightStore } from '@/stores/highlight';
import { useToastStore } from '@/stores/toast';
import { useUndoStore } from '@/stores/undo';
import { colors, layout, radius, spacing, typography } from '@/theme';

export default function CompletedScreen() {
  const router = useRouter();
  const filters = useFilterStore((state) => state.completed);
  const updateFilters = useFilterStore((state) => state.update);
  const clearFilters = useFilterStore((state) => state.clear);
  const { types } = useTypes();
  const bump = useDataVersion((state) => state.bump);
  const undo = useUndoStore();
  const toast = useToastStore();
  const highlightId = useHighlightStore((state) => state.todoId);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedKeyword = useDebouncedValue(filters.keyword, 250);
  const { items, loading, loadingMore, hasMore, loadMore } = useCompletedTodos({
    ...filters,
    keyword: debouncedKeyword,
  });

  const listRef = useRef<FlatList<TodoListItem>>(null);

  const selectedTypeName = findTypeName(types, filters.typeId);
  const activeFilterCount =
    (filters.typeId ? 1 : 0) + (filters.priorities.length > 0 ? 1 : 0);
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
    router.push({ pathname: '/todo/[id]', params: { id: item.id, from: 'completed' } });
  };

  const handleUncomplete = async (id: string) => {
    try {
      await uncompleteTodo(id);
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
          onAction={() => clearFilters('completed')}
          title="没有符合条件的已完成待办"
        />
      );
    }

    return (
      <EmptyState
        description="在待完成页右滑一条待办，即可完成"
        icon={CheckCircle2}
        title="还没有完成的待办"
      />
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }

    if (!hasMore && items.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>没有更多了</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  };

  return (
    <Screen>
      <PageHeader
        subtitle={loading ? undefined : `${items.length} 项`}
        title="已完成"
      />

      <View style={styles.body}>
        <View style={styles.searchRow}>
          <SearchBar
            onChangeText={(keyword) => updateFilters('completed', { keyword })}
            placeholder="搜索已完成的待办"
            value={filters.keyword}
          />
        </View>

        <View style={styles.toolbar}>
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
                onPress={() => updateFilters('completed', { typeId: null })}
                selected
              />
            ) : null}
            {filters.priorities.length > 0 ? (
              <Chip
                label={`优先级：${filters.priorities
                  .map((priority) => PRIORITY_SHORT[priority])
                  .join('、')}`}
                onPress={() => updateFilters('completed', { priorities: [] })}
                selected
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => clearFilters('completed')}
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
            { paddingBottom: selectionMode ? spacing.lg : 24 },
          ]}
          data={items}
          extraData={`${selectionMode}-${selectedIds.join(',')}-${highlightId ?? ''}`}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty()}
          ListFooterComponent={items.length > 0 ? renderFooter() : undefined}
          onEndReached={() => {
            if (hasMore && !loading) void loadMore();
          }}
          onEndReachedThreshold={0.3}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              animated: true,
              offset: info.averageItemLength * info.index,
            });
          }}
          renderItem={({ item }) => (
            <SwipeableTodoRow
              completed
              highlighted={highlightId === item.id}
              onLongPress={() =>
                selectionMode ? toggleSelection(item.id) : startSelection(item.id)
              }
              onPress={() =>
                selectionMode ? toggleSelection(item.id) : openDetail(item)
              }
              onSwipe={() => void handleUncomplete(item.id)}
              selected={selectedIds.includes(item.id)}
              selectionMode={selectionMode}
              swipeEnabled={!selectionMode}
              swipeTone="uncomplete"
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

      <FilterSheet
        onClose={() => setFilterSheetOpen(false)}
        onOpenTypePicker={() => {
          setFilterSheetOpen(false);
          setTypePickerOpen(true);
        }}
        tab="completed"
        types={types}
        visible={filterSheetOpen}
      />

      <TypePickerSheet
        includeAll
        onClose={() => setTypePickerOpen(false)}
        onSelect={(typeId) => updateFilters('completed', { typeId })}
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
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerSpacer: {
    height: spacing.sm,
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
