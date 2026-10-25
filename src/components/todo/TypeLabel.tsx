import { StyleSheet, Text, View } from 'react-native';

import { getTypeIcon } from '@/lib/type-icons';
import { colors } from '@/theme';

interface TypeLabelProps {
  icon: string;
  name: string;
}

export function TypeLabel({ icon, name }: TypeLabelProps) {
  const Icon = getTypeIcon(icon);

  return (
    <View style={styles.container}>
      <Icon color={colors.textMuted} size={13} strokeWidth={2} />
      <Text numberOfLines={1} style={styles.text}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
