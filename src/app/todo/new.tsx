import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TodoForm } from '@/components/todo/TodoForm';
import { createTodo } from '@/db';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-guard';
import { promptForReminderPermissions } from '@/notifications/permissions';
import {
  createEmptyTodoForm,
  validateTodoForm,
  type TodoFormErrors,
  type TodoFormValues,
} from '@/lib/todo-form';
import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';
import { useHighlightStore } from '@/stores/highlight';
import { colors, radius, spacing, typography } from '@/theme';

export default function NewTodoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<TodoFormValues>(createEmptyTodoForm);
  const [initial] = useState<TodoFormValues>(createEmptyTodoForm);
  const [errors, setErrors] = useState<TodoFormErrors>({});
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useUnsavedChangesGuard(isDirty);

  const handleChange = (patch: Partial<TodoFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({
      ...current,
      ...(patch.name !== undefined ? { name: undefined } : {}),
      ...(patch.typeId !== undefined ? { typeId: undefined } : {}),
    }));
  };

  const handleSave = async () => {
    const nextErrors = validateTodoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const id = await createTodo({
        name: values.name.trim(),
        typeId: values.typeId as string,
        priority: values.priority,
        dueAt: values.dueAt,
        detail: values.detail.trim(),
      });

      guard.bypass();
      useFilterStore.getState().clear('pending');
      useHighlightStore.getState().highlight(id);
      useDataVersion.getState().bump();
      router.back();
      void promptForReminderPermissions(values.dueAt != null);
    } catch {
      Alert.alert('保存失败', '请稍后重试');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHeader onBack={guard.attemptBack} title="新建待办" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TodoForm
            autoFocusName
            errors={errors}
            onChange={handleChange}
            values={values}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          ]}>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              pressed && styles.pressed,
            ]}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>创建</Text>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
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
    opacity: 0.6,
  },
  saveText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
