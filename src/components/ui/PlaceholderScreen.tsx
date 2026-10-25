import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { PageHeader } from './PageHeader';
import { Screen } from './Screen';
import type { IconComponent } from './types';

interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon: IconComponent;
  phase?: string;
}

export function PlaceholderScreen({
  title,
  description,
  icon: Icon,
  phase,
}: PlaceholderScreenProps) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <Screen>
      <PageHeader title={title} onBack={handleBack} />
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Icon color={colors.primary} size={30} strokeWidth={1.8} />
        </View>

        {phase ? (
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>{phase}</Text>
          </View>
        ) : null}

        <Text style={styles.description}>{description}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 64,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  phasePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  phaseText: {
    ...typography.label,
    color: colors.primary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});
