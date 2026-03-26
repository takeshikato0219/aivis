import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import i18n from '@/i18n';
import authService from '@/services/authService';
import { store } from '@redux/store';
import { getRuleCodesFromFcmData } from '@/screens/Detail/Detail.constants';
import { emitCountDetectionEvent } from '@/services/countDetectionEventService';
import notificationsService from '@/services/notificationsService';
import rulesService from '@/services/rulesService';
import { appBadgeService } from '@/services/appBadgeService';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '@navigation/navigationRef';

const ANDROID_CHANNEL_ID = 'fcm_default_channel';

const RULE_ICON_MAP: Record<string, string> = {
  home_return_count: 'IconHome',
  daily_passerby: 'IconPerson',
  unregistered_detection: 'IconSuspect',
  creature_detection: 'IconBear',
  visitor_count: 'IconHome',
  vip_customer_detection: 'IconVip',
  customer_attribute_report: 'IconPerson',
  suspicious_behavior_detection: 'IconSuspect',
  access_prohibition_detection: 'IconBan',
  attendance: 'IconAttendance',
  enterprise_attendance: 'IconAttendance',
  unexpected_incident: 'IconPerson',
  helmet_wearing: 'IconHelmet',
  mask_wearing: 'IconMark',
  glove_wearing: 'IconGlove',
  restricted_area_intrusion: 'IconBan',
};

const DEFAULT_ICON = 'IconHome';

class PushNotificationService {
  private unsubscribeForeground: (() => void) | null = null;
  private unsubscribeNotificationOpened: (() => void) | null = null;
  private unsubscribeNotifeeForeground: (() => void) | null = null;
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
   * Check if notification should be suppressed (silent count-update push: `data` contains a rule key from RULE_CONFIGS_BY_WORKFLOW, e.g. visitor_count).
   */
  private shouldSuppressNotification(remoteMessage: any): boolean {
    return getRuleCodesFromFcmData(remoteMessage?.data).length > 0;
  }

  /**
   * Normalize notification data to Record<string, string | undefined>.
   */
  private normalizeNotificationData(data: Record<string, any>): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : value != null ? String(value) : undefined;
    }
    return result;
  }

  /**
   * Handle notification tap - navigate same as Notifications.tsx item click.
   */
  private async handleNotificationOpened(data: Record<string, string | undefined>): Promise<void> {
    if (!navigationRef.isReady()) return;
    const state = store.getState();
    const userId = state.auth.user?.id;
    if (!userId) return;

    try {
      let notification = null;
      const notificationId = data?.notification_id ?? data?.notificationId;
      if (notificationId) {
        const response = await notificationsService.updateNotificationSeen(notificationId, true);
        if (Platform.OS === 'ios') {
          const currentBadge = await appBadgeService.getBadgeCount();
          await appBadgeService.setBadgeCount(Math.max(0, currentBadge - 1));
        }
        const cameraId = response?.camera_id ?? data?.cameraId;
        const rulesMasterId = response?.rules_master_id ?? data?.rulesMasterId;
        const sentAt = response?.sent_at ?? response?.created_at ?? data?.sentAt;
        if (cameraId && rulesMasterId) {
          notification = {
            id: notificationId ?? '',
            detection_id: data?.detection_id ?? '',
            camera_rules_id: data?.camera_rules_id ?? '',
            rules_master_id: rulesMasterId,
            user_id: userId,
            camera_id: cameraId,
            line_user_id: null,
            message: data?.message ?? '',
            is_seen: true,
            sent_at: sentAt ?? '',
            created_at: sentAt ?? '',
            updated_at: sentAt ?? '',
          } as any;
        }
      }
      const navigateToScreen = (
        screen: 'Notifications' | 'CustomerReport' | 'ListNotificationCamera',
        params: object
      ) => {
        if (navigationRef.isReady()) {
          navigationRef.dispatch(
            CommonActions.navigate({
              name: 'App',
              params: { screen, params },
            })
          );
        }
      };

      if (!notification) {
        navigateToScreen('Notifications', { userId });
        return;
      }

      const rulesResponse = await rulesService.getRules();
      const rules = Array.isArray(rulesResponse?.data) ? rulesResponse.data : [];
      const matchedRule = rules.find((r: any) => r.id === notification.rules_master_id);
      const isCustomerAttributeReport = matchedRule?.code === 'customer_attribute_report';
      const iconName = (matchedRule?.code && RULE_ICON_MAP[matchedRule.code]) || DEFAULT_ICON;
      const itemName = matchedRule?.rule_name || notification.message;
      if (isCustomerAttributeReport) {
        navigateToScreen('CustomerReport', { title: itemName, icon: iconName });
      } else {
        const dateValue = notification.sent_at || notification.created_at;
        const detectedAt = dateValue ? new Date(dateValue).toISOString().slice(0, 10) : undefined;
        navigateToScreen('ListNotificationCamera', {
          title: itemName,
          icon: iconName,
          code: matchedRule?.code || '',
          cameraId: notification.camera_id,
          detected_at: detectedAt,
        });
      }
    } catch (err) {
      console.warn('[PushNotification] handleNotificationOpened error:', err);
      if (userId && navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.navigate({
            name: 'App',
            params: { screen: 'Notifications', params: { userId } },
          })
        );
      }
    }
  }

  /**
   * Get image URI for notification. On iOS, WebP is not supported by UNNotificationAttachment,
   * so we download and convert to JPEG. Returns original URL if conversion fails or on Android.
   */
  private async getNotificationImageUri(imageUrl: string): Promise<string> {
    if (!imageUrl) return '';
    const isWebp =
      imageUrl.toLowerCase().includes('.webp') || imageUrl.toLowerCase().includes('format=webp');
    if (Platform.OS !== 'ios' || !isWebp) {
      return imageUrl;
    }
    try {
      const cacheDir = RNFS.CachesDirectoryPath;
      const tempPath = `${cacheDir}/notification_img_${Date.now()}.webp`;
      const { promise } = RNFS.downloadFile({ fromUrl: imageUrl, toFile: tempPath });
      await promise;
      const resized = await ImageResizer.createResizedImage(
        tempPath,
        1200,
        1200,
        'JPEG',
        85,
        0,
        undefined,
        false,
        {}
      );
      await RNFS.unlink(tempPath).catch(() => {});
      return resized.path.startsWith('file://') ? resized.path.slice(7) : resized.path;
    } catch (err) {
      console.warn('[PushNotification] Failed to convert webp for iOS, using URL:', err);
      return imageUrl;
    }
  }

  /**
   * Display notifications when receiving push notifications (foreground on both Android & iOS).
   */
  private async displayForegroundNotification(remoteMessage: any): Promise<void> {
    try {
      if (this.shouldSuppressNotification(remoteMessage)) {
        return;
      }
      const title =
        remoteMessage.notification?.title ??
        remoteMessage.data?.title ??
        i18n.t('pushNotification.defaultTitle');
      const body =
        remoteMessage.notification?.body ??
        remoteMessage.data?.body ??
        remoteMessage.data?.message ??
        '';
      const imageUrl =
        remoteMessage.data?.image_url ?? remoteMessage.data?.fcm_options?.image ?? '';
      const imageUri = imageUrl ? await this.getNotificationImageUri(imageUrl) : '';

      const notificationPayload: Parameters<typeof notifee.displayNotification>[0] = {
        title,
        body,
        data: remoteMessage.data ?? {},
      };

      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: ANDROID_CHANNEL_ID,
          name: i18n.t('pushNotification.channelName'),
          importance: AndroidImportance.HIGH,
        });
        notificationPayload.android = {
          channelId: ANDROID_CHANNEL_ID,
          pressAction: { id: 'default' },
          ...(imageUri && {
            largeIcon: imageUri,
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: imageUri,
            },
          }),
        };
      } else {
        notificationPayload.ios = {
          foregroundPresentationOptions: {
            banner: true,
            list: true,
            badge: true,
            sound: true,
          },
          ...(imageUri && {
            attachments: [
              {
                url: imageUri,
                typeHint: 'public.jpeg',
              },
            ],
          }),
        };
      }

      await notifee.displayNotification(notificationPayload);
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
        const codes = getRuleCodesFromFcmData(remoteMessage?.data);
        if (codes.length > 0) {
          const cameraId = remoteMessage?.data?.camera_id;
          emitCountDetectionEvent({
            codes,
            camera_id: cameraId != null ? String(cameraId) : undefined,
          });
        }
      });

      // Listen for Firebase notification opened (app was in background)
      this.unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[PushNotification] Firebase notification opened:', remoteMessage);
        const data = this.normalizeNotificationData(remoteMessage?.data ?? {});
        this.handleNotificationOpened(data);
      });

      // Listen for Notifee notification press (we displayed it in foreground)
      this.unsubscribeNotifeeForeground = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = (detail.notification?.data ?? {}) as Record<string, string | undefined>;
          if (Object.keys(data).length > 0) {
            this.handleNotificationOpened(data);
          }
        }
      });

      // Listen for token refresh
      this.unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        console.log('[PushNotification] Token refreshed');
        await this.registerTokenWithBackend(newToken);
      });

      // Check if app was opened from a notification (cold start)
      const firebaseInitial = await messaging().getInitialNotification();
      if (firebaseInitial?.data) {
        console.log('[PushNotification] App opened from Firebase notification');
        await this.handleNotificationOpened(this.normalizeNotificationData(firebaseInitial.data));
      } else {
        const notifeeInitial = await notifee.getInitialNotification();
        if (notifeeInitial?.notification?.data) {
          console.log('[PushNotification] App opened from Notifee notification');
          const data = notifeeInitial.notification.data as Record<string, string | undefined>;
          await this.handleNotificationOpened(data);
        }
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
    this.unsubscribeNotifeeForeground?.();
    this.unsubscribeNotifeeForeground = null;
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
