import { useCallback } from 'react';
import { Alert } from 'react-native';

import {
  deleteTypeSubtree,
  getTypeDeleteInfo,
  restoreTypeSubtree,
} from '@/db';
import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';
import { useToastStore } from '@/stores/toast';
import { useUndoStore } from '@/stores/undo';

export function useTypeDeletion() {
  const bump = useDataVersion((state) => state.bump);
  const undo = useUndoStore();
  const toast = useToastStore();

  const performDelete = useCallback(
    async (typeId: string, typeName: string, onDeleted?: () => void) => {
      try {
        const info = await getTypeDeleteInfo(typeId);
        const snapshot = await deleteTypeSubtree(typeId);

        const filters = useFilterStore.getState();
        for (const tab of ['pending', 'completed'] as const) {
          const filter = filters[tab];
          if (filter.typeId && snapshot.typeIds.includes(filter.typeId)) {
            filters.update(tab, { typeId: null });
          }
        }

        bump();
        undo.show({
          message: `已删除「${typeName}」及 ${info.todoCount} 条待办`,
          restore: async () => {
            const result = await restoreTypeSubtree(snapshot);
            if (result.renamed) {
              toast.show({ message: '类型已恢复，重名项已自动改名' });
            }
          },
        });
        onDeleted?.();
      } catch {
        Alert.alert('删除失败', '请稍后重试');
      }
    },
    [bump, toast, undo]
  );

  const requestDelete = useCallback(
    (typeId: string, typeName: string, onDeleted?: () => void) => {
      getTypeDeleteInfo(typeId)
        .then((info) => {
          Alert.alert(
            '删除类型',
            `「${typeName}」下有 ${info.todoCount} 条待办、${info.childCount} 个子类型。删除后 5 秒内可撤销。`,
            [
              { text: '取消', style: 'cancel' },
              {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                  void performDelete(typeId, typeName, onDeleted);
                },
              },
            ]
          );
        })
        .catch(() => {
          Alert.alert('删除失败', '无法读取类型信息，请稍后重试');
        });
    },
    [performDelete]
  );

  return { requestDelete };
}
