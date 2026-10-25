import { StyleSheet, Text, View } from 'react-native';

import { PRIORITY_SHORT, type Priority } from '@/lib/priority';
import { priorityColors } from '@/theme';

interface PriorityChipProps {
  priority: Priority;
}

export function PriorityChip({ priority }: PriorityChipProps) {
  const color = priorityColors[priority];

  return (
    <View style={[styles.chip, { backgroundColor: `${color}18`, borderColor: `${color}45` }]}>
      <Text style={[styles.text, { color }]}>{PRIORITY_SHORT[priority]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
});
