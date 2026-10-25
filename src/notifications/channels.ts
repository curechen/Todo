import notifee, { AndroidImportance } from '@notifee/react-native';

export const DUE_CHANNEL_ID = 'due';
export const SUMMARY_CHANNEL_ID = 'overdue';

export async function ensureChannels(): Promise<void> {
  await notifee.createChannel({
    id: DUE_CHANNEL_ID,
    name: '到期提醒',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });

  await notifee.createChannel({
    id: SUMMARY_CHANNEL_ID,
    name: '逾期汇总',
    importance: AndroidImportance.DEFAULT,
  });
}
