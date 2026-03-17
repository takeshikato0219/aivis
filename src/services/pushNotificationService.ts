import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import i18n from '@/i18n';
import authService from '@/services/authService';
import { store } from '@redux/store';

const ANDROID_CHANNEL_ID = 'fcm_default_channel';

export interface PushNotificationData {
  [key: string]: string | undefined;
}

class PushNotificationService {
  private unsubscribeForeground: (() => void) | null = null;
  private unsubscribeNotificationOpened: (() => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;

  /**
   * Request notification permission (Android 13+)
   */
  private async requestAndroidNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 33) {
        const permission =
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ??
          'android.permission.POST_NOTIFICATIONS';
        const granted = await PermissionsAndroid.request(permission, {
          title: i18n.t('pushNotification.permissionTitle'),
          message: i18n.t('pushNotification.permissionMessage'),
          buttonPositive: i18n.t('pushNotification.allow'),
          buttonNegative: i18n.t('pushNotification.deny'),
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('[PushNotification] Android permission error:', error);
      return false;
    }
  }

  /**
   * Request notification permission (iOS/Android) and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidNotificationPermission();
        if (!granted) {
          console.log('[PushNotification] Android permission denied');
          return null;
        }
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('[PushNotification] iOS permission denied');
          return null;
        }
      }

      const token = await messaging().getToken();
      if (token) {
        console.log('[PushNotification] FCM token obtained', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('[PushNotification] Error getting token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend via authService.updateProfile (device_token)
   */
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const state = store.getState();
      if (!state.auth.accessToken) return;

      await authService.updateProfile({ device_token: token });
    } catch (error) {
      console.warn('[PushNotification] Could not register token with backend:', error);
    }
  }

  /**
   * Display notifications when receiving push notifications.
   */
  private async displayForegroundNotification(remoteMessage: any): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await notifee.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: i18n.t('pushNotification.channelName'),
        importance: AndroidImportance.HIGH,
      });

      const title =
        remoteMessage.notification?.title ??
        remoteMessage.data?.title ??
        i18n.t('pushNotification.defaultTitle');
      const body = remoteMessage.notification?.body ?? remoteMessage.data?.body ?? '';

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      });
    } catch (error) {
      console.error('[PushNotification] displayForegroundNotification error:', error);
    }
  }

  /**
   * Initialize push notifications - call on app startup when user is logged in
   */
  async init(): Promise<void> {
    try {
      const token = await this.requestPermissionAndGetToken();
      if (token) {
        await this.registerTokenWithBackend(token);
      }

      // Listen for foreground messages
      this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log('[PushNotification] Foreground message:', remoteMessage);
        await this.displayForegroundNotification(remoteMessage);
      });

      // Listen for notification opened (user tapped notification)
      this.unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[PushNotification] Notification opened:', remoteMessage);
        // Navigate to relevant screen based on remoteMessage.data
      });

      // Listen for token refresh
      this.unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        console.log('[PushNotification] Token refreshed');
        await this.registerTokenWithBackend(newToken);
      });

      // Check if app was opened from a notification (cold start)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[PushNotification] App opened from notification:', initialNotification);
      }
    } catch (error) {
      console.error('[PushNotification] Init error:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    this.unsubscribeForeground?.();
    this.unsubscribeForeground = null;
    this.unsubscribeNotificationOpened?.();
    this.unsubscribeNotificationOpened = null;
    this.unsubscribeTokenRefresh?.();
    this.unsubscribeTokenRefresh = null;
  }

  /**
   * Delete FCM token (call on logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
    } catch (error) {
      console.error('[PushNotification] Error deleting token:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
