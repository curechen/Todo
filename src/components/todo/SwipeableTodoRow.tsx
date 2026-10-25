import * as Haptics from 'expo-haptics';
import { Check, RotateCcw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

import { TodoRow, type TodoRowProps } from './TodoRow';

interface SwipeableTodoRowProps extends TodoRowProps {
  swipeEnabled?: boolean;
  swipeTone?: 'complete' | 'uncomplete';
  onSwipe: () => void;
}

interface SwipeActionProps {
  progress: SharedValue<number>;
  width: number;
  backgroundColor: string;
  children: ReactNode;
}

function SwipeAction({ progress, width, backgroundColor, children }: SwipeActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.5),
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.action, { width, backgroundColor }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export function SwipeableTodoRow({
  swipeEnabled = true,
  swipeTone = 'complete',
  onSwipe,
  ...rowProps
}: SwipeableTodoRowProps) {
  const { width } = useWindowDimensions();
  const triggered = useRef(false);

  if (!swipeEnabled) {
    return <TodoRow {...rowProps} />;
  }

  const threshold = Math.max(96, width * 0.3);
  const isComplete = swipeTone === 'complete';
  const Icon = isComplete ? Check : RotateCcw;
  const label = isComplete ? '完成' : '取消完成';
  const tone = isComplete ? colors.success : colors.primary;

  const renderAction = (progress: SharedValue<number>) => (
    <SwipeAction backgroundColor={tone} progress={progress} width={threshold}>
      <Icon color={colors.white} size={22} strokeWidth={2.4} />
      <Text style={styles.actionText}>{label}</Text>
    </SwipeAction>
  );

  const handleOpen = () => {
    if (triggered.current) return;
    triggered.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSwipe();
  };

  return (
    <ReanimatedSwipeable
      childrenContainerStyle={styles.childrenContainer}
      containerStyle={styles.container}
      friction={2}
      leftThreshold={threshold}
      onSwipeableOpen={handleOpen}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderAction}
      renderRightActions={renderAction}
      rightThreshold={threshold}>
      <TodoRow {...rowProps} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  childrenContainer: {
    backgroundColor: colors.surface,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '100%',
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
