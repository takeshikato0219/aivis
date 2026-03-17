/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const ANDROID_CHANNEL_ID = 'fcm_default_channel';

// Background message handler - must be registered before App
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[PushNotification] Background message:', remoteMessage);

  if (Platform.OS === 'android' && !remoteMessage.notification) {
    try {
      await notifee.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Notifications',
        importance: AndroidImportance.HIGH,
      });
      const title = remoteMessage.data?.title ?? 'Notification';
      const body = remoteMessage.data?.body ?? '';
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      console.warn('[PushNotification] Background display error:', e);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
