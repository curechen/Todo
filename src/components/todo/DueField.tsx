import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarClock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDue, isOverdue } from '@/lib/date';
import { colors, radius, spacing, typography } from '@/theme';

interface DueFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

type PickerMode = 'date' | 'time';

export function DueField({ value, onChange }: DueFieldProps) {
  const [mode, setMode] = useState<PickerMode | null>(null);
  const [draft, setDraft] = useState<Date>(new Date());
  const overdue = value != null && isOverdue(value, null);

  const openPicker = () => {
    setDraft(value ? new Date(value) : new Date());
    setMode('date');
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setMode(null);
      return;
    }

    if (mode === 'date') {
      const next = new Date(draft);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setDraft(next);
      setMode('time');
      return;
    }

    if (mode === 'time') {
      const next = new Date(draft);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setMode(null);

      if (next.getTime() < Date.now()) {
        Alert.alert('时间无效', '不能选择过去的时间');
        return;
      }

      onChange(next.getTime());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>预计完成时间</Text>
        {value != null ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onChange(null)}>
            <Text style={styles.clearText}>清除</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>可选</Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          overdue && styles.fieldOverdue,
          pressed && styles.pressed,
        ]}>
        <CalendarClock
          color={overdue ? colors.danger : colors.textMuted}
          size={18}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.value,
            value == null && styles.placeholder,
            overdue && styles.overdueText,
          ]}>
          {value != null ? formatDue(value) : '选择日期和时间'}
        </Text>
      </Pressable>

      {mode ? (
        <DateTimePicker
          display="default"
          is24Hour
          minimumDate={mode === 'date' ? new Date() : undefined}
          mode={mode}
          onChange={handleChange}
          value={draft}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  clearText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  field: {
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
  fieldOverdue: {
    borderColor: `${colors.danger}55`,
    backgroundColor: colors.dangerSoft,
  },
  value: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
