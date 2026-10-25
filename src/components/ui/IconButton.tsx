import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';
import type { IconComponent } from './types';

interface IconButtonProps {
  icon: IconComponent;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
}

export function IconButton({ icon: Icon, onPress, accessibilityLabel, size = 22 }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon color={colors.text} size={size} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
