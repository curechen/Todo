import { useRouter } from 'expo-router';
import { FolderTree, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TypeTreeRow } from '@/components/type/TypeTreeRow';
import { reorderTypes, type TypeRow } from '@/db';
import { useTypeDeletion } from '@/hooks/use-type-deletion';
import { useTypes } from '@/hooks/use-types';
import { buildTypeTree, flattenTypeTree } from '@/lib/type-tree';
import { useDataVersion } from '@/stores/data-version';
import { useTypeHighlightStore } from '@/stores/type-highlight';
import { colors, spacing, typography } from '@/theme';

const ROOT_KEY = '__root__';

interface RowLayout {
  y: number;
  height: number;
}

export default function TypesScreen() {
  const router = useRouter();
  const { types } = useTypes();
  const { requestDelete } = useTypeDeletion();
  const bump = useDataVersion((state) => state.bump);
  const highlightId = useTypeHighlightStore((state) => state.typeId);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const layoutRef = useRef(new Map<string, RowLayout>());
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollOffsetRef = useRef(0);
  const scrollTopRef = useRef(0);

  const items = useMemo(() => flattenTypeTree(buildTypeTree(types)), [types]);

  const siblingCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const type of types) {
      const key = type.parentId ?? ROOT_KEY;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  }, [types]);

  useEffect(() => {
    if (!highlightId) return;

    const timer = setTimeout(() => {
      const layout = layoutRef.current.get(highlightId);
      if (!layout) return;

      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, layout.y - 80),
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [highlightId, items]);

  const handleDrop = async (typeId: string, dropY: number) => {
    const node = items.find((item) => item.id === typeId);
    if (!node) return;

    const siblings = items.filter((item) => item.parentId === node.parentId);
    const currentIds = siblings.map((item) => item.id);
    const others = siblings.filter((item) => item.id !== typeId);
    const dropCenter = dropY - scrollTopRef.current + scrollOffsetRef.current;
    let target = others.length;

    for (let index = 0; index < others.length; index += 1) {
      const layout = layoutRef.current.get(others[index].id);
      if (layout && dropCenter < layout.y + layout.height / 2) {
        target = index;
        break;
      }
    }

    const ordered = others.map((item) => item.id);
    ordered.splice(target, 0, typeId);

    if (ordered.join('|') === currentIds.join('|')) return;

    try {
      await reorderTypes(node.parentId, ordered);
      bump();
    } catch {
      Alert.alert('排序失败', '请稍后重试');
    }
  };

  const openEdit = (type: TypeRow) => {
    router.push({ pathname: '/types/[id]', params: { id: type.id } });
  };

  const openAddChild = (type: TypeRow) => {
    router.push({ pathname: '/types/new', params: { parentId: type.id } });
  };

  return (
    <Screen>
      <PageHeader
        onBack={() => router.back()}
        right={
          <IconButton
            accessibilityLabel="新建根类型"
            icon={Plus}
            onPress={() => router.push('/types/new')}
          />
        }
        title="类型管理"
      />

      {types.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            actionLabel="新建类型"
            description="创建第一个类型，开始整理待办"
            icon={FolderTree}
            onAction={() => router.push('/types/new')}
            title="还没有类型"
          />
        </View>
      ) : (
        <>
          <View style={styles.hintRow}>
            <Text style={styles.hint}>
              {sortMode
                ? '按住右侧手柄拖动，调整同层顺序；列表可滚动'
                : '点击类型编辑；右侧 ＋ 添加子类型'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSortMode((current) => !current)}
              style={({ pressed }) => [styles.sortButton, pressed && styles.sortButtonPressed]}>
              <Text style={styles.sortButtonText}>{sortMode ? '完成' : '排序'}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            ref={scrollRef}
            scrollEnabled={draggingId == null}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TypeTreeRow
                key={item.id}
                depth={item.depth}
                dragEnabled={sortMode}
                dragging={draggingId === item.id}
                hasSiblings={(siblingCounts.get(item.parentId ?? ROOT_KEY) ?? 0) > 1}
                highlighted={highlightId === item.id}
                onAddChild={() => openAddChild(item)}
                onDelete={() => requestDelete(item.id, item.name)}
                onDragFinish={() => setDraggingId(null)}
                onDragStart={() => {
                  setDraggingId(item.id);
                  scrollRef.current?.measureInWindow((_x, y) => {
                    scrollTopRef.current = y;
                  });
                }}
                onDrop={(dropY) => {
                  void handleDrop(item.id, dropY);
                }}
                onLayout={(y, height) => {
                  layoutRef.current.set(item.id, { y, height });
                }}
                onPress={() => openEdit(item)}
                type={item}
              />
            ))}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  sortButtonPressed: {
    opacity: 0.8,
  },
  sortButtonText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyWrap: {
    flex: 1,
  },
});
