import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import type { TypeRow } from '@/db/schema';
import { getTypeIcon } from '@/lib/type-icons';
import type { TypeFormErrors, TypeFormValues } from '@/lib/type-form';
import { colors, radius, spacing, typography } from '@/theme';

import { IconPickerSheet } from './IconPickerSheet';
import { TypePickerSheet } from '@/components/todo/TypePickerSheet';

interface TypeFormProps {
  values: TypeFormValues;
  errors: TypeFormErrors;
  parentTypes: TypeRow[];
  autoFocusName?: boolean;
  onChange: (patch: Partial<TypeFormValues>) => void;
}

export function TypeForm({
  values,
  errors,
  parentTypes,
  autoFocusName = false,
  onChange,
}: TypeFormProps) {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);

  const Icon = getTypeIcon(values.icon);
  const selectedParent = values.parentId
    ? parentTypes.find((type) => type.id === values.parentId)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>图标</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIconPickerOpen(true)}
          style={({ pressed }) => [styles.fieldButton, pressed && styles.pressed]}>
          <View style={styles.iconCircle}>
            <Icon color={colors.primary} size={22} strokeWidth={2} />
          </View>
          <Text style={styles.fieldText}>选择图标</Text>
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
      </View>

      <TextField
        autoFocus={autoFocusName}
        error={errors.name}
        hint={`${values.name.length}/20`}
        label="类型名称"
        maxLength={20}
        onChangeText={(name) => onChange({ name })}
        placeholder="例如：阅读"
        required
        value={values.name}
      />

      <View style={styles.field}>
        <Text style={styles.label}>父层级</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setParentPickerOpen(true)}
          style={({ pressed }) => [styles.fieldButton, pressed && styles.pressed]}>
          <View style={styles.parentIcon}>
            {selectedParent ? (
              (() => {
                const ParentIcon = getTypeIcon(selectedParent.icon);
                return <ParentIcon color={colors.primary} size={17} strokeWidth={2} />;
              })()
            ) : (
              <Text style={styles.rootMark}>根</Text>
            )}
          </View>
          <Text style={styles.fieldText}>
            {selectedParent ? selectedParent.name : '根层级'}
          </Text>
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
        <Text style={styles.hint}>不选择父层级时，类型放在最外层</Text>
      </View>

      <IconPickerSheet
        onClose={() => setIconPickerOpen(false)}
        onSelect={(icon) => onChange({ icon })}
        selectedIcon={values.icon}
        visible={iconPickerOpen}
      />

      <TypePickerSheet
        allLabel="根层级"
        includeAll
        onClose={() => setParentPickerOpen(false)}
        onSelect={(parentId) => onChange({ parentId })}
        selectedId={values.parentId}
        title="选择父层级"
        types={parentTypes}
        visible={parentPickerOpen}
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
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootMark: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  fieldText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});
