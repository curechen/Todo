import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, layout } from '@/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FloatingActionButton({
  onPress,
  accessibilityLabel = '新建待办',
}: FloatingActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Plus color={colors.white} size={28} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: layout.fabOffset,
    bottom: layout.fabOffset,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
});
