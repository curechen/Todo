import notifee, { EventType } from '@notifee/react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useDataVersion } from '@/stores/data-version';
import { useFilterStore } from '@/stores/filters';

import { setPendingNotificationData, useNotificationIntentStore } from './intent';
import { reconcileNotifications } from './scheduler';

export function NotificationBootstrap() {
  const router = useRouter();
  const intent = useNotificationIntentStore((state) => state.intent);
  const clear = useNotificationIntentStore((state) => state.clear);

  useEffect(() => {
    let mounted = true;

    notifee
      .getInitialNotification()
      .then((initial) => {
        if (mounted && initial?.notification?.data) {
          setPendingNotificationData(initial.notification.data);
        }
      })
      .catch(() => {});

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        setPendingNotificationData(detail.notification?.data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!intent) return;

    clear();

    if (intent.kind === 'due') {
      router.push({
        pathname: '/todo/[id]',
        params: { id: intent.todoId, from: 'pending' },
      });
      return;
    }

    useFilterStore.getState().clear('pending');
    useFilterStore.getState().update('pending', { overdueOnly: true });
    router.navigate('/');
  }, [clear, intent, router]);

  useEffect(() => {
    void reconcileNotifications();

    const unsubscribe = useDataVersion.subscribe((state, previous) => {
      if (state.version !== previous.version) {
        void reconcileNotifications();
      }
    });

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void reconcileNotifications();
      }
    });

    return () => {
      unsubscribe();
      appState.remove();
    };
  }, []);

  return null;
}
