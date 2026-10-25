import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>页面不存在</Text>
        <Text style={styles.description}>这个页面可能已经被移动或删除。</Text>
        <Link href="/" style={styles.link}>
          返回首页
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
