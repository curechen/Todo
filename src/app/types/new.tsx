import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { TypeForm } from '@/components/type/TypeForm';
import { createType, TypeNameConflictError } from '@/db';
import { useTypes } from '@/hooks/use-types';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-guard';
import {
  createEmptyTypeForm,
  validateTypeForm,
  type TypeFormErrors,
  type TypeFormValues,
} from '@/lib/type-form';
import { useDataVersion } from '@/stores/data-version';
import { useTypeHighlightStore } from '@/stores/type-highlight';
import { colors, radius, spacing, typography } from '@/theme';

export default function NewTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ parentId?: string | string[] }>();
  const paramParentId =
    typeof params.parentId === 'string' ? params.parentId : null;

  const { types } = useTypes();
  const bump = useDataVersion((state) => state.bump);
  const [values, setValues] = useState<TypeFormValues>(() =>
    createEmptyTypeForm(paramParentId)
  );
  const [initial] = useState<TypeFormValues>(() =>
    createEmptyTypeForm(paramParentId)
  );
  const [errors, setErrors] = useState<TypeFormErrors>({});
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useUnsavedChangesGuard(isDirty, {
    title: '放弃本次编辑？',
    message: '当前新建类型尚未保存。',
  });

  const handleChange = (patch: Partial<TypeFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    if (patch.name !== undefined) {
      setErrors((current) => ({ ...current, name: undefined }));
    }
  };

  const handleSave = async () => {
    const nextErrors = validateTypeForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const id = await createType({
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
      } else {
        Alert.alert('创建失败', '请稍后重试');
      }
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHeader onBack={guard.attemptBack} title="新建类型" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TypeForm
            autoFocusName
            errors={errors}
            onChange={handleChange}
            parentTypes={types}
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
