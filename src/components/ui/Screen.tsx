import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

interface ScreenProps {
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, style }: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();

  return <View style={[styles.container, { paddingTop: insets.top }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
