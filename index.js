/**
 * @format
 */

import './src/api/axiosConfig';
import { AppRegistry, Platform } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { getRuleCodesFromFcmData } from './src/screens/Detail/Detail.constants';

const ANDROID_CHANNEL_ID = 'fcm_default_channel';

// Silent count-update push: `data` contains one or more rule keys from RULE_CONFIGS_BY_WORKFLOW
const shouldSuppressNotification = (remoteMessage) =>
  getRuleCodesFromFcmData(remoteMessage?.data).length > 0;

// Background message handler - must be registered before App
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
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
        sound: 'default',
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
          sound: 'default',
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
