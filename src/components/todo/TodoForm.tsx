import { ChevronRight, Folder } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { TypeQuickCreateSheet } from '@/components/type/TypeQuickCreateSheet';
import { useTypes } from '@/hooks/use-types';
import type { Priority } from '@/lib/priority';
import type { TodoFormErrors, TodoFormValues } from '@/lib/todo-form';
import { getTypeIcon } from '@/lib/type-icons';
import { colors, radius, spacing, typography } from '@/theme';

import { DueField } from './DueField';
import { PrioritySelector } from './PrioritySelector';
import { TypePickerSheet } from './TypePickerSheet';

interface TodoFormProps {
  values: TodoFormValues;
  errors: TodoFormErrors;
  autoFocusName?: boolean;
  onChange: (patch: Partial<TodoFormValues>) => void;
}

export function TodoForm({
  values,
  errors,
  autoFocusName = false,
  onChange,
}: TodoFormProps) {
  const { types } = useTypes();
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const selectedType = values.typeId
    ? types.find((type) => type.id === values.typeId)
    : undefined;
  const TypeIcon = getTypeIcon(selectedType?.icon);

  return (
    <View style={styles.container}>
      <TextField
        autoFocus={autoFocusName}
        error={errors.name}
        label="待办名称"
        maxLength={100}
        onChangeText={(name) => onChange({ name })}
        placeholder="要做什么？"
        required
        returnKeyType="next"
        value={values.name}
      />

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            类型<Text style={styles.required}> *</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTypePickerOpen(true)}
          style={({ pressed }) => [
            styles.typeField,
            errors.typeId && styles.typeFieldError,
            pressed && styles.pressed,
          ]}>
          <View style={styles.typeIcon}>
            <TypeIcon color={colors.primary} size={18} strokeWidth={2} />
          </View>
          <Text style={[styles.typeText, !selectedType && styles.placeholder]}>
            {selectedType ? selectedType.name : '选择类型'}
          </Text>
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
        {errors.typeId ? <Text style={styles.error}>{errors.typeId}</Text> : null}
      </View>

      <PrioritySelector
        onChange={(priority: Priority) => onChange({ priority })}
        value={values.priority}
      />

      <DueField onChange={(dueAt) => onChange({ dueAt })} value={values.dueAt} />

      <TextField
        hint={`${values.detail.length}/200`}
        label="详情"
        maxLength={200}
        multiline
        onChangeText={(detail) => onChange({ detail })}
        placeholder="补充说明（可选）"
        value={values.detail}
      />

      <TypePickerSheet
        allowCreate
        onCreateRequest={() => {
          setTypePickerOpen(false);
          setQuickCreateOpen(true);
        }}
        onClose={() => setTypePickerOpen(false)}
        onSelect={(typeId) => onChange({ typeId })}
        selectedId={values.typeId}
        title="选择类型"
        types={types}
        visible={typePickerOpen}
      />

      <TypeQuickCreateSheet
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(typeId) => onChange({ typeId })}
        visible={quickCreateOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  typeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  typeFieldError: {
    borderColor: colors.danger,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
});
