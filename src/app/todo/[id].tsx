import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileQuestion, MoreHorizontal } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TodoForm } from '@/components/todo/TodoForm';
import { deleteTodos, restoreTodos, updateTodo } from '@/db';
import { useTodo } from '@/hooks/use-todo';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-guard';
import { promptForReminderPermissions } from '@/notifications/permissions';
import { formatCompleted } from '@/lib/date';
import { matchesFilter } from '@/lib/filter-match';
import {
  validateTodoForm,
  type TodoFormErrors,
  type TodoFormValues,
} from '@/lib/todo-form';
import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';
import { useHighlightStore } from '@/stores/highlight';
import { useToastStore } from '@/stores/toast';
import { useUndoStore } from '@/stores/undo';
import { colors, radius, spacing, typography } from '@/theme';

type SourceTab = 'pending' | 'completed';

export default function TodoDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[]; from?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const source: SourceTab = params.from === 'completed' ? 'completed' : 'pending';

  const { todo, loading } = useTodo(id);
  const bump = useDataVersion((state) => state.bump);

  const [values, setValues] = useState<TodoFormValues | null>(null);
  const [initial, setInitial] = useState<TodoFormValues | null>(null);
  const [errors, setErrors] = useState<TodoFormErrors>({});
  const [saving, setSaving] = useState(false);

  const isDirty =
    values != null && initial != null && JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!todo) return;

    const next: TodoFormValues = {
      name: todo.name,
      typeId: todo.typeId,
      priority: todo.priority,
      dueAt: todo.dueAt,
      detail: todo.detail,
    };

    setValues(next);
    setInitial(next);
    setErrors({});
  }, [todo?.id]);

  const handleChange = (patch: Partial<TodoFormValues>) => {
    setValues((current) => (current ? { ...current, ...patch } : current));
    setErrors((current) => ({
      ...current,
      ...(patch.name !== undefined ? { name: undefined } : {}),
      ...(patch.typeId !== undefined ? { typeId: undefined } : {}),
    }));
  };

  const handleSave = async () => {
    if (!values || !id || !todo) return;

    const nextErrors = validateTodoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const nextValues: TodoFormValues = {
        ...values,
        name: values.name.trim(),
        detail: values.detail.trim(),
      };

      await updateTodo(id, {
        name: nextValues.name,
        typeId: nextValues.typeId as string,
        priority: nextValues.priority,
        dueAt: nextValues.dueAt,
        detail: nextValues.detail,
      });

      const filter = useFilterStore.getState()[source];
      let stillMatches = true;

      try {
        stillMatches = await matchesFilter(
          {
            name: nextValues.name,
            detail: nextValues.detail,
            typeId: nextValues.typeId as string,
            priority: nextValues.priority,
            dueAt: nextValues.dueAt,
            completedAt: todo.completedAt,
          },
          filter
        );
      } catch {
        stillMatches = true;
      }

      guard.bypass();
      useHighlightStore.getState().highlight(id);
      bump();

      if (!stillMatches) {
        useToastStore.getState().show({
          message: '已不符合当前筛选条件',
          actionLabel: '清除筛选',
          onAction: () => useFilterStore.getState().clear(source),
        });
      }

      router.back();
      void promptForReminderPermissions(values.dueAt != null);
    } catch {
      Alert.alert('保存失败', '请稍后重试');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!todo) return;

    Alert.alert(
      '删除待办',
      `确定删除「${todo.name}」？删除后 5 秒内可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            void handleDelete();
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const snapshots = await deleteTodos([id]);
      guard.bypass();
      useUndoStore.getState().show({
        message: '已删除 1 条待办',
        restore: () => restoreTodos(snapshots),
      });
      bump();
      router.back();
    } catch {
      Alert.alert('删除失败', '请稍后重试');
    }
  };

  const openMenu = () => {
    Alert.alert('更多操作', undefined, [
      { text: '删除待办', style: 'destructive', onPress: confirmDelete },
      { text: '取消', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader onBack={guard.attemptBack} title="待办详情" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!todo || !values || !initial) {
    return (
      <Screen>
        <PageHeader onBack={guard.attemptBack} title="待办详情" />
        <View style={styles.flex}>
          <EmptyState
            actionLabel="返回"
            description="它可能已经被删除"
            icon={FileQuestion}
            onAction={() => router.back()}
            title="找不到这条待办"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        onBack={guard.attemptBack}
        right={
          <IconButton
            accessibilityLabel="更多操作"
            icon={MoreHorizontal}
            onPress={openMenu}
          />
        }
        title="待办详情"
      />

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            todo.completedAt ? styles.statusDotDone : styles.statusDotPending,
          ]}
        />
        <Text style={styles.statusText}>
          {todo.completedAt
            ? `已完成 · ${formatCompleted(todo.completedAt)}`
            : '待完成'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TodoForm errors={errors} onChange={handleChange} values={values} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          ]}>
          <Pressable
            accessibilityRole="button"
            disabled={saving || !isDirty}
            onPress={() => {
              void handleSave();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              (saving || !isDirty) && styles.saveButtonDisabled,
              pressed && styles.pressed,
            ]}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>保存</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotPending: {
    backgroundColor: colors.primary,
  },
  statusDotDone: {
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
