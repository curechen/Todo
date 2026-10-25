import { GripVertical, Plus, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { TypeRow } from '@/db/schema';
import { getTypeIcon } from '@/lib/type-icons';
import { colors, radius, spacing, typography } from '@/theme';

interface TypeTreeRowProps {
  type: TypeRow;
  depth: number;
  hasSiblings: boolean;
  dragEnabled: boolean;
  dragging: boolean;
  highlighted: boolean;
  onPress: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragFinish: () => void;
  onDrop: (dropY: number) => void;
  onLayout: (y: number, height: number) => void;
}

export function TypeTreeRow({
  type,
  depth,
  hasSiblings,
  dragEnabled,
  dragging,
  highlighted,
  onPress,
  onAddChild,
  onDelete,
  onDragStart,
  onDragFinish,
  onDrop,
  onLayout,
}: TypeTreeRowProps) {
  const Icon = getTypeIcon(type.icon);
  const translateY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart(() => {
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const dropY = event.absoluteY;
      translateY.value = withTiming(0, { duration: 120 });
      runOnJS(onDrop)(dropY);
    })
    .onFinalize(() => {
      runOnJS(onDragFinish)();
    });

  const translateStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      onLayout={(event) =>
        onLayout(event.nativeEvent.layout.y, event.nativeEvent.layout.height)
      }
      style={[
        styles.row,
        highlighted && styles.rowHighlighted,
        dragging && styles.rowDragging,
        translateStyle,
      ]}>
      <Pressable
        accessibilityLabel={`${type.name}，${depth === 0 ? '根层级' : '子类型'}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.main,
          { paddingLeft: spacing.md + depth * 18 },
          pressed && styles.pressed,
        ]}>
        <View style={styles.icon}>
          <Icon color={colors.primary} size={18} strokeWidth={2} />
        </View>
        <Text numberOfLines={1} style={styles.name}>
          {type.name}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel={`在 ${type.name} 下添加子类型`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={onAddChild}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
        <Plus color={colors.primary} size={18} strokeWidth={2.2} />
      </Pressable>

      <Pressable
        accessibilityLabel={`删除类型 ${type.name}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={onDelete}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
        <Trash2 color={colors.danger} size={17} strokeWidth={2} />
      </Pressable>

      {hasSiblings ? (
        dragEnabled ? (
          <GestureDetector gesture={dragGesture}>
            <View
              accessibilityLabel="拖动排序"
              accessibilityRole="button"
              style={styles.dragHandle}>
              <GripVertical color={colors.primary} size={20} strokeWidth={2} />
            </View>
          </GestureDetector>
        ) : (
          <View style={styles.dragHandle}>
            <GripVertical color={colors.borderStrong} size={20} strokeWidth={2} />
          </View>
        )
      ) : (
        <View style={styles.dragPlaceholder} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowDragging: {
    zIndex: 20,
    elevation: 10,
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingRight: spacing.sm,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  action: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  dragHandle: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragPlaceholder: {
    width: 32,
    height: 44,
  },
  pressed: {
    opacity: 0.8,
  },
});
