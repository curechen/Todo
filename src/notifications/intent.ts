import { create } from 'zustand';

export type NotificationIntent =
  | { kind: 'due'; todoId: string }
  | { kind: 'summary' };

interface NotificationIntentState {
  intent: NotificationIntent | null;
  setIntent: (intent: NotificationIntent) => void;
  clear: () => void;
}

export const useNotificationIntentStore = create<NotificationIntentState>((set) => ({
  intent: null,
  setIntent: (intent) => set({ intent }),
  clear: () => set({ intent: null }),
}));

export function setPendingNotificationData(
  data: Record<string, unknown> | null | undefined
): void {
  if (!data) return;

  if (data.kind === 'due' && typeof data.todoId === 'string') {
    useNotificationIntentStore.getState().setIntent({ kind: 'due', todoId: data.todoId });
  } else if (data.kind === 'summary') {
    useNotificationIntentStore.getState().setIntent({ kind: 'summary' });
  }
}
