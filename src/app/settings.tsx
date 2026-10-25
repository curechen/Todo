import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlarmClock,
  BatteryCharging,
  Bell,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import type { IconComponent } from '@/components/ui/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { getSetting, setSetting } from '@/db';
import { APP_VERSION } from '@/lib/app';
import {
  getExactAlarmPermission,
  getNotificationPermission,
  isBatteryOptimizationEnabled,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  openNotificationSettings,
  type ExactAlarmPermission,
  type NotificationPermission,
} from '@/notifications/permissions';
import { cancelAllReminders, reconcileNotifications } from '@/notifications/scheduler';
import { colors, radius, spacing, typography } from '@/theme';

type PermissionState<T> = T | 'loading';

interface PermissionRowProps {
  icon: IconComponent;
  title: string;
  description: string;
  status: string;
  statusTone: 'success' | 'danger' | 'muted';
  actionLabel?: string;
  onAction?: () => void;
  isLast?: boolean;
}

function PermissionRow({
  icon: Icon,
  title,
  description,
  status,
  statusTone,
  actionLabel,
  onAction,
  isLast,
}: PermissionRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon color={colors.primary} size={19} strokeWidth={2} />
        </View>

        <View style={styles.info}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
          <Text
            style={[
              styles.status,
              statusTone === 'success' && styles.statusSuccess,
              statusTone === 'danger' && styles.statusDanger,
            ]}>
            {status}
          </Text>
        </View>

        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {isLast ? null : <View style={styles.divider} />}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [summaryTime, setSummaryTime] = useState('10:00');
  const [notificationPermission, setNotificationPermission] =
    useState<PermissionState<NotificationPermission>>('loading');
  const [exactAlarm, setExactAlarm] =
    useState<PermissionState<ExactAlarmPermission>>('loading');
  const [batteryOptimized, setBatteryOptimized] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const [enabled, time, notification, exact, battery] = await Promise.all([
      getSetting('reminders_enabled'),
      getSetting('daily_summary_time'),
      getNotificationPermission(),
      getExactAlarmPermission(),
      isBatteryOptimizationEnabled(),
    ]);

    setRemindersEnabled(enabled !== 'false');
    setSummaryTime(time ?? '10:00');
    setNotificationPermission(notification);
    setExactAlarm(exact);
    setBatteryOptimized(battery);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });

    return () => subscription.remove();
  }, [load]);

  const toggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await setSetting('reminders_enabled', value ? 'true' : 'false');

    if (value) {
      await reconcileNotifications();
    } else {
      await cancelAllReminders();
    }

    await load();
  };

  const openTimePicker = () => {
    const [hours, minutes] = summaryTime.split(':').map(Number);
    const value = new Date();
    value.setHours(hours, minutes, 0, 0);

    DateTimePickerAndroid.open({
      value,
      mode: 'time',
      is24Hour: true,
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return;

        const next = `${String(selected.getHours()).padStart(2, '0')}:${String(
          selected.getMinutes()
        ).padStart(2, '0')}`;

        setSummaryTime(next);
        void (async () => {
          await setSetting('daily_summary_time', next);
          await reconcileNotifications();
        })();
      },
    });
  };

  const notificationStatus =
    notificationPermission === 'loading'
      ? '检查中…'
      : notificationPermission === 'granted'
        ? '已开启'
        : '未开启';
  const exactAlarmStatus =
    exactAlarm === 'loading'
      ? '检查中…'
      : exactAlarm === 'granted'
        ? '已开启'
        : exactAlarm === 'not_supported'
          ? '无需设置（Android 12 以下）'
          : '未开启';
  const batteryStatus =
    batteryOptimized == null
      ? '检查中…'
      : batteryOptimized
        ? '未忽略'
        : '已忽略';

  return (
    <Screen>
      <PageHeader onBack={() => router.back()} title="设置" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Bell color={colors.primary} size={19} strokeWidth={2} />
              </View>
              <View style={styles.info}>
                <Text style={styles.rowTitle}>提醒开关</Text>
                <Text style={styles.rowDescription}>到期提醒和每日逾期汇总</Text>
              </View>
              <Switch
                onValueChange={(value) => {
                  void toggleReminders(value);
                }}
                thumbColor={colors.white}
                trackColor={{ false: colors.border, true: colors.primary }}
                value={remindersEnabled}
              />
            </View>

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              onPress={openTimePicker}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.icon}>
                <Clock color={colors.primary} size={19} strokeWidth={2} />
              </View>
              <View style={styles.info}>
                <Text style={styles.rowTitle}>每日逾期汇总时间</Text>
                <Text style={styles.rowDescription}>有逾期待办时，每天在这个时间提醒</Text>
              </View>
              <Text style={styles.timeValue}>{summaryTime}</Text>
              <ChevronRight color={colors.textMuted} size={18} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>权限与可靠性</Text>
          <View style={styles.card}>
            <PermissionRow
              actionLabel={notificationPermission === 'loading' ? undefined : '去设置'}
              description="到期提醒和汇总通知需要通知权限"
              icon={Bell}
              onAction={() => {
                void openNotificationSettings();
              }}
              status={notificationStatus}
              statusTone={
                notificationPermission === 'granted'
                  ? 'success'
                  : notificationPermission === 'loading'
                    ? 'muted'
                    : 'danger'
              }
              title="通知权限"
            />

            <PermissionRow
              actionLabel={exactAlarm === 'not_supported' ? undefined : '去设置'}
              description="Android 12+ 精确准时提醒需要「闹钟和提醒」权限"
              icon={AlarmClock}
              isLast={false}
              onAction={() => {
                void openExactAlarmSettings();
              }}
              status={exactAlarmStatus}
              statusTone={
                exactAlarm === 'granted' || exactAlarm === 'not_supported'
                  ? 'success'
                  : exactAlarm === 'loading'
                    ? 'muted'
                    : 'danger'
              }
              title="精确闹钟权限"
            />

            <PermissionRow
              actionLabel="去设置"
              description="关闭电池优化有助于提醒准时送达"
              icon={BatteryCharging}
              isLast
              onAction={() => {
                void openBatteryOptimizationSettings();
              }}
              status={batteryStatus}
              statusTone={batteryOptimized === false ? 'success' : 'muted'}
              title="电池优化"
            />
          </View>

          <Text style={styles.note}>
            通知权限或精确闹钟权限未授予时，不会发送任何提醒。所有提醒仅在本机处理。
          </Text>
        </View>

        <Text style={styles.version}>小陈待办 · v{APP_VERSION}</Text>
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  rowDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  status: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusSuccess: {
    color: colors.success,
  },
  statusDanger: {
    color: colors.danger,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  timeValue: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 19,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
});
