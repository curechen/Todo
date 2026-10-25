import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodoListItem } from '@/db';
import { formatCompleted, formatDue, isOverdue } from '@/lib/date';
import { getTypeIcon } from '@/lib/type-icons';
import { colors, radius, spacing, typography } from '@/theme';

import { PriorityChip } from './PriorityChip';
import { TypeLabel } from './TypeLabel';

export interface TodoRowProps {
  todo: TodoListItem;
  completed?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TodoRow({
  todo,
  completed = false,
  selectionMode = false,
  selected = false,
  highlighted = false,
  onPress,
  onLongPress,
}: TodoRowProps) {
  const TypeIcon = getTypeIcon(todo.typeIcon);
  const overdue = !completed && isOverdue(todo.dueAt, todo.completedAt);

  const timeText =
    completed && todo.completedAt
      ? `完成于 ${formatCompleted(todo.completedAt)}`
      : todo.dueAt
        ? `${overdue ? '逾期 · ' : ''}${formatDue(todo.dueAt)}`
        : '未设置时间';

  return (
    <Pressable
      accessibilityLabel={`${todo.name}，${todo.typeName}，优先级 ${todo.priority}`}
      accessibilityRole="button"
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        highlighted && styles.highlighted,
        pressed && styles.pressed,
      ]}>
      {selectionMode ? (
        <View style={[styles.selectCircle, selected && styles.selectCircleSelected]}>
          {selected ? <Check color={colors.white} size={14} strokeWidth={3} /> : null}
        </View>
      ) : (
        <View style={styles.typeIcon}>
          <TypeIcon color={colors.primary} size={18} strokeWidth={2} />
        </View>
      )}

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>
          {todo.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <TypeLabel icon={todo.typeIcon} name={todo.typeName} />
            <PriorityChip priority={todo.priority} />
          </View>
          <Text numberOfLines={1} style={[styles.time, overdue && styles.overdue]}>
            {timeText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  highlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.85,
  },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  selectCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  overdue: {
    color: colors.danger,
    fontWeight: '600',
  },
});
