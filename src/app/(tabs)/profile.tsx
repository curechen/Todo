import { router } from 'expo-router';
import { FolderTree, Settings as SettingsIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionRow } from '@/components/ui/ActionRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StatCard } from '@/components/ui/StatCard';
import { getDashboardStats, getTypeCount, type DashboardStats } from '@/db';
import { APP_NAME, APP_VERSION } from '@/lib/app';
import { useDataVersion } from '@/stores/data-version';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const version = useDataVersion((state) => state.version);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [typeCount, setTypeCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([getDashboardStats(), getTypeCount()])
      .then(([nextStats, nextTypeCount]) => {
        if (!mounted) return;
        setStats(nextStats);
        setTypeCount(nextTypeCount);
      })
      .catch(() => {
        if (!mounted) return;
        setStats({ total: 0, pending: 0, completed: 0 });
        setTypeCount(0);
      });

    return () => {
      mounted = false;
    };
  }, [version]);

  const typeDescription = typeCount === null ? '读取中…' : `${typeCount} 个类型`;

  return (
    <Screen>
      <PageHeader subtitle={APP_NAME} title="我的" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard label="总计" value={stats?.total ?? '—'} />
          <StatCard accent={colors.primary} label="待完成" value={stats?.pending ?? '—'} />
          <StatCard accent={colors.success} label="已完成" value={stats?.completed ?? '—'} />
        </View>

        <View style={styles.card}>
          <ActionRow
            description={typeDescription}
            icon={FolderTree}
            onPress={() => router.push('/types')}
            title="类型管理"
          />
          <ActionRow
            description="提醒与通知"
            icon={SettingsIcon}
            isLast
            onPress={() => router.push('/settings')}
            title="设置"
          />
        </View>

        <View style={styles.footer}>
          {stats === null ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
          <Text style={styles.footerText}>
            {APP_NAME} · v{APP_VERSION}
          </Text>
          <Text style={styles.footerHint}>数据仅保存在本机</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerHint: {
    ...typography.label,
    color: colors.textMuted,
  },
});
