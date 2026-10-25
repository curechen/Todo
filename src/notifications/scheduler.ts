import notifee, { AlarmType, TriggerType } from '@notifee/react-native';
import { format } from 'date-fns';

import { getSetting, listPendingWithDue, type TodoListItem } from '@/db';
import { formatDue } from '@/lib/date';

import {
  DUE_CHANNEL_ID,
  ensureChannels,
  SUMMARY_CHANNEL_ID,
} from './channels';
import { getExactAlarmPermission, getNotificationPermission } from './permissions';

const DUE_PREFIX = 'due:';
const SUMMARY_PREFIX = 'summary:';
const SUMMARY_DAYS = 14;
const DEFAULT_SUMMARY_TIME = '10:00';

interface TriggerInput {
  id: string;
  when: number;
  title: string;
  body: string;
  channelId: string;
  data: Record<string, string>;
}

export async function cancelAllReminders(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const ours = ids.filter(
    (id) => id.startsWith(DUE_PREFIX) || id.startsWith(SUMMARY_PREFIX)
  );

  if (ours.length > 0) {
    await notifee.cancelTriggerNotifications(ours);
  }
}

async function scheduleTrigger(input: TriggerInput): Promise<void> {
  await notifee.createTriggerNotification(
    {
      id: input.id,
      title: input.title,
      body: input.body,
      data: input.data,
      android: {
        channelId: input.channelId,
        smallIcon: 'ic_stat_todo',
        pressAction: { id: 'default' },
        autoCancel: true,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: input.when,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    }
  );
}

export function computeSummaryDays(
  pending: TodoListItem[],
  now: number,
  dailyTime: string,
  days = SUMMARY_DAYS
): number[] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(dailyTime);
  const hours = match ? Number(match[1]) : 10;
  const minutes = match ? Number(match[2]) : 0;
  const result: number[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(hours, minutes, 0, 0);

    const when = date.getTime();
    if (when <= now) continue;

    const hasOverdueBefore = pending.some(
      (todo) => todo.dueAt != null && todo.dueAt < when
    );

    if (hasOverdueBefore) result.push(when);
  }

  return result;
}

async function runReconcile(): Promise<void> {
  try {
    await ensureChannels();
    await cancelAllReminders();

    const enabled = await getSetting('reminders_enabled');
    if (enabled === 'false') return;

    if ((await getNotificationPermission()) !== 'granted') return;
    if ((await getExactAlarmPermission()) === 'denied') return;

    const pending = await listPendingWithDue();
    const now = Date.now();

    for (const todo of pending) {
      if (!todo.dueAt || todo.dueAt <= now) continue;

      await scheduleTrigger({
        id: `${DUE_PREFIX}${todo.id}`,
        when: todo.dueAt,
        title: todo.name,
        body: `预计完成时间：${formatDue(todo.dueAt)}`,
        channelId: DUE_CHANNEL_ID,
        data: { kind: 'due', todoId: todo.id },
      });
    }

    const dailyTime =
      (await getSetting('daily_summary_time')) ?? DEFAULT_SUMMARY_TIME;
    const summaryTimes = computeSummaryDays(pending, now, dailyTime, SUMMARY_DAYS);

    for (const when of summaryTimes) {
      await scheduleTrigger({
        id: `${SUMMARY_PREFIX}${format(new Date(when), 'yyyy-MM-dd')}`,
        when,
        title: '有逾期待办',
        body: '点击查看逾期列表',
        channelId: SUMMARY_CHANNEL_ID,
        data: { kind: 'summary' },
      });
    }
  } catch (error) {
    console.warn('reconcileNotifications failed', error);
  }
}

let queue: Promise<void> = Promise.resolve();

export function reconcileNotifications(): Promise<void> {
  const run = () => runReconcile();
  queue = queue.then(run, run);
  return queue;
}
