import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { TextField } from '@/components/ui/TextField';
import { TypePickerSheet } from '@/components/todo/TypePickerSheet';
import { createType, TypeNameConflictError } from '@/db';
import { useTypes } from '@/hooks/use-types';
import { getTypeIcon, TYPE_ICON_OPTIONS } from '@/lib/type-icons';
import { useDataVersion } from '@/stores/data-version';
import { colors, radius, spacing, typography } from '@/theme';

interface TypeQuickCreateSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (typeId: string) => void;
}

export function TypeQuickCreateSheet({
  visible,
  onClose,
  onCreated,
}: TypeQuickCreateSheetProps) {
  const { types } = useTypes();
  const bump = useDataVersion((state) => state.bump);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);

  const parent = parentId ? types.find((type) => type.id === parentId) : null;

  const reset = () => {
    setName('');
    setIcon('folder');
    setParentId(null);
    setError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError('请输入类型名称');
      return;
    }

    setError(undefined);
    setSaving(true);

    try {
      const id = await createType({ name: trimmed, icon, parentId });
      bump();
      onCreated(id);
      handleClose();
    } catch (err) {
      if (err instanceof TypeNameConflictError) {
        setError('同一父层级下已有同名类型');
      } else {
        Alert.alert('创建失败', '请稍后重试');
      }
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={handleClose} title="新建类型" visible={visible}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TextField
          error={error}
          hint={`${name.length}/20`}
          label="类型名称"
          maxLength={20}
          onChangeText={(value) => {
            setName(value);
            setError(undefined);
          }}
          placeholder="例如：阅读"
          required
          value={name}
        />

        <View style={styles.field}>
          <Text style={styles.label}>图标</Text>
          <View style={styles.icons}>
            {TYPE_ICON_OPTIONS.map((option) => {
              const Icon = getTypeIcon(option.key);
              const selected = option.key === icon;

              return (
                <Pressable
                  key={option.key}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setIcon(option.key)}
                  style={({ pressed }) => [
                    styles.iconButton,
                    selected && styles.iconButtonSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Icon
                    color={selected ? colors.primary : colors.textSecondary}
                    size={19}
                    strokeWidth={2}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>父层级</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setParentPickerOpen(true)}
            style={({ pressed }) => [styles.fieldButton, pressed && styles.pressed]}>
            <Text style={styles.fieldText}>{parent ? parent.name : '根层级'}</Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => {
              void handleCreate();
            }}
            style={({ pressed }) => [
              styles.createButton,
              saving && styles.createButtonDisabled,
              pressed && styles.pressed,
            ]}>
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.createText}>创建并选中</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <TypePickerSheet
        allLabel="根层级"
        includeAll
        onClose={() => setParentPickerOpen(false)}
        onSelect={(id) => setParentId(id)}
        selectedId={parentId}
        title="选择父层级"
        types={types}
        visible={parentPickerOpen}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  fieldText: {
    ...typography.body,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  cancelText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  createButton: {
    flex: 2,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createText: {
    ...typography.captionStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.8,
  },
});
