import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileQuestion, MoreHorizontal } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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
import { TypeForm } from '@/components/type/TypeForm';
import {
  getTypeDescendantIds,
  TypeNameConflictError,
  TypeParentError,
  updateType,
} from '@/db';
import { useType } from '@/hooks/use-type';
import { useTypeDeletion } from '@/hooks/use-type-deletion';
import { useTypes } from '@/hooks/use-types';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-guard';
import {
  validateTypeForm,
  type TypeFormErrors,
  type TypeFormValues,
} from '@/lib/type-form';
import { useDataVersion } from '@/stores/data-version';
import { useTypeHighlightStore } from '@/stores/type-highlight';
import { colors, radius, spacing, typography } from '@/theme';

export default function EditTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const { type, loading } = useType(id);
  const { types } = useTypes();
  const { requestDelete } = useTypeDeletion();
  const bump = useDataVersion((state) => state.bump);

  const [values, setValues] = useState<TypeFormValues | null>(null);
  const [initial, setInitial] = useState<TypeFormValues | null>(null);
  const [errors, setErrors] = useState<TypeFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const isDirty =
    values != null && initial != null && JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useUnsavedChangesGuard(isDirty, {
    title: '放弃本次修改？',
    message: '当前修改尚未保存。',
  });

  useEffect(() => {
    if (!type) return;

    const next: TypeFormValues = {
      name: type.name,
      icon: type.icon,
      parentId: type.parentId,
    };

    setValues(next);
    setInitial(next);
    setErrors({});
  }, [type?.id]);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    getTypeDescendantIds(id)
      .then((ids) => {
        if (mounted) setExcludedIds(ids);
      })
      .catch(() => {
        if (mounted) setExcludedIds([]);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const parentTypes = useMemo(
    () => types.filter((item) => !excludedIds.includes(item.id)),
    [types, excludedIds]
  );

  const handleChange = (patch: Partial<TypeFormValues>) => {
    setValues((current) => (current ? { ...current, ...patch } : current));
    if (patch.name !== undefined) {
      setErrors((current) => ({ ...current, name: undefined }));
    }
  };

  const handleSave = async () => {
    if (!id || !values || !type) return;

    const nextErrors = validateTypeForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      await updateType(id, {
        name: values.name.trim(),
        icon: values.icon,
        parentId: values.parentId,
      });

      guard.bypass();
      useTypeHighlightStore.getState().highlight(id);
      bump();
      router.back();
    } catch (error) {
      if (error instanceof TypeNameConflictError) {
        setErrors({ name: '同一父层级下已有同名类型' });
      } else if (error instanceof TypeParentError) {
        Alert.alert('无法保存', '不能把类型移动到自身或其子类型下');
      } else {
        Alert.alert('保存失败', '请稍后重试');
      }
      setSaving(false);
    }
  };

  const openMenu = () => {
    if (!type) return;

    Alert.alert('更多操作', undefined, [
      {
        text: '删除类型',
        style: 'destructive',
        onPress: () => {
          requestDelete(type.id, type.name, () => {
            guard.bypass();
            router.back();
          });
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader onBack={guard.attemptBack} title="编辑类型" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!type || !values || !initial) {
    return (
      <Screen>
        <PageHeader onBack={guard.attemptBack} title="编辑类型" />
        <View style={styles.flex}>
          <EmptyState
            actionLabel="返回"
            description="它可能已经被删除"
            icon={FileQuestion}
            onAction={() => router.back()}
            title="找不到这个类型"
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
        title="编辑类型"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TypeForm
            errors={errors}
            onChange={handleChange}
            parentTypes={parentTypes}
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
