/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const ANDROID_CHANNEL_ID = 'fcm_default_channel';

// Check if notification should be suppressed (silent/background data-only)
const shouldSuppressNotification = (remoteMessage) => !!remoteMessage?.data?.event_type;

// Background message handler - must be registered before App
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[PushNotification] Background message:', remoteMessage);

  if (shouldSuppressNotification(remoteMessage)) {
    return;
  }

  if (Platform.OS === 'android' && !remoteMessage.notification) {
    try {
      await notifee.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Notifications',
        importance: AndroidImportance.HIGH,
      });
      const title =
        remoteMessage.notification?.title ?? remoteMessage.data?.title ?? 'Notification';
      const body =
        remoteMessage.notification?.body ??
        remoteMessage.data?.body ??
        remoteMessage.data?.message ??
        '';
      const imageUrl =
        remoteMessage.data?.image_url ?? remoteMessage.data?.fcm_options?.image ?? '';

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          pressAction: { id: 'default' },
          ...(imageUrl && {
            largeIcon: imageUrl,
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: imageUrl,
            },
          }),
        },
      });
    } catch (e) {
      console.warn('[PushNotification] Background display error:', e);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
