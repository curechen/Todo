import { format, isSameDay, isTomorrow, isYesterday } from 'date-fns';

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm');
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd');
}

export function formatDue(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (isSameDay(date, now)) return `今天 ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `明天 ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `昨天 ${format(date, 'HH:mm')}`;
  if (date.getFullYear() === now.getFullYear()) return format(date, 'MM-dd HH:mm');
  return format(date, 'yyyy-MM-dd HH:mm');
}

export function formatCompleted(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (isSameDay(date, now)) return `今天 ${format(date, 'HH:mm')}`;
  if (date.getFullYear() === now.getFullYear()) return format(date, 'MM-dd HH:mm');
  return format(date, 'yyyy-MM-dd HH:mm');
}

export function isOverdue(dueAt: number | null, completedAt: number | null): boolean {
  return dueAt != null && completedAt == null && dueAt < Date.now();
}

export function fromMinute(date: Date): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}
