import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '搜索名称或详情',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search color={colors.textMuted} size={18} strokeWidth={2} />
      <TextInput
        accessibilityLabel="搜索待办"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        selectionColor={colors.primary}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      {value ? (
        <Pressable
          accessibilityLabel="清空搜索"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}>
          <X color={colors.textMuted} size={16} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    color: colors.text,
    ...typography.body,
    fontSize: 15,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  clearPressed: {
    opacity: 0.7,
  },
});
