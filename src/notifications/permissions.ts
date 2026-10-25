import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Alert, Linking } from 'react-native';

import { getSetting, setSetting } from '@/db';

import { reconcileNotifications } from './scheduler';

export type NotificationPermission = 'granted' | 'denied';
export type ExactAlarmPermission = 'granted' | 'denied' | 'not_supported';

export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      ? 'granted'
      : 'denied';
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      ? 'granted'
      : 'denied';
  } catch {
    return 'denied';
  }
}

export async function getExactAlarmPermission(): Promise<ExactAlarmPermission> {
  try {
    const settings = await notifee.getNotificationSettings();
    const alarm = settings.android.alarm;

    if (alarm === AndroidNotificationSetting.NOT_SUPPORTED) return 'not_supported';
    return alarm === AndroidNotificationSetting.ENABLED ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function openNotificationSettings(): Promise<void> {
  try {
    await notifee.openNotificationSettings();
  } catch {
    await Linking.openSettings();
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  try {
    await notifee.openAlarmPermissionSettings();
  } catch {
    await Linking.openSettings();
  }
}

export async function isBatteryOptimizationEnabled(): Promise<boolean> {
  try {
    return await notifee.isBatteryOptimizationEnabled();
  } catch {
    return false;
  }
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  try {
    await notifee.openBatteryOptimizationSettings();
  } catch {
    // Ignore on platforms without this setting.
  }
}

export async function promptForReminderPermissions(hasDue: boolean): Promise<void> {
  if (!hasDue) return;

  try {
    const prompted = await getSetting('notification_prompted');
    if (prompted === 'true') return;

    await setSetting('notification_prompted', 'true');

    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      Alert.alert(
        '通知权限未开启',
        '需要允许通知，才能发送到期提醒。待办仍会正常保存。',
        [
          { text: '稍后', style: 'cancel' },
          { text: '去设置', onPress: () => void openNotificationSettings() },
        ]
      );
      return;
    }

    const exactAlarm = await getExactAlarmPermission();

    if (exactAlarm === 'denied') {
      Alert.alert(
        '需要精确闹钟权限',
        'Android 12 及以上需要允许「闹钟和提醒」，否则不会发送任何提醒。',
        [
          { text: '稍后', style: 'cancel' },
          { text: '去设置', onPress: () => void openExactAlarmSettings() },
        ]
      );
      return;
    }

    await reconcileNotifications();
  } catch {
    // Permission errors should never block saving a todo.
  }
}
