import notifee, { EventType } from '@notifee/react-native';

import { setPendingNotificationData } from './intent';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    setPendingNotificationData(detail.notification?.data);
  }
});
