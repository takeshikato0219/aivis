import { pushNotificationService } from '@/services/pushNotificationService';

const AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 3 };
jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = {
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    onTokenRefresh: jest.fn(),
    getInitialNotification: jest.fn(),
    deleteToken: jest.fn(),
  };
  const messagingFactory = () => mockMessaging;
  messagingFactory.AuthorizationStatus = AuthorizationStatus;
  return {
    __esModule: true,
    default: messagingFactory,
    AuthorizationStatus,
  };
});
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(),
  displayNotification: jest.fn(),
  onForegroundEvent: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  AndroidImportance: { HIGH: 4 },
  AndroidStyle: { BIGPICTURE: 'bigPicture' },
  EventType: { PRESS: 1 },
}));
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 33,
    select: (obj: { android?: any; ios?: any; default?: any }) =>
      obj.android ?? obj.ios ?? obj.default,
  },
  PermissionsAndroid: {
    request: jest.fn(),
    PERMISSIONS: { POST_NOTIFICATIONS: 'POST_NOTIFICATIONS' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
  },
}));
jest.mock('@/i18n', () => ({ t: (key: string) => key }));
jest.mock('@/services/authService', () => ({ updateProfile: jest.fn() }));
jest.mock('@redux/store', () => ({ store: { getState: jest.fn() } }));
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  downloadFile: jest.fn(() => ({ promise: Promise.resolve({ statusCode: 200 }) })),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));
jest.mock('@bam.tech/react-native-image-resizer', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_IMAGE_RESIZER__?: { __esModule: boolean; default: { createResizedImage: jest.Mock } };
  };
  if (!g.__TEST_PN_IMAGE_RESIZER__) {
    g.__TEST_PN_IMAGE_RESIZER__ = {
      __esModule: true,
      default: {
        createResizedImage: jest.fn(() =>
          Promise.resolve({ uri: 'file:///cache/img.jpg', path: '/cache/img.jpg' })
        ),
      },
    };
  }
  return g.__TEST_PN_IMAGE_RESIZER__;
});

jest.mock('@/services/notificationsService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_NOTIFICATIONS__?: {
      __esModule: boolean;
      default: {
        getNotificationById: jest.Mock;
        updateNotificationSeen: jest.Mock;
      };
    };
  };
  if (!g.__TEST_PN_NOTIFICATIONS__) {
    g.__TEST_PN_NOTIFICATIONS__ = {
      __esModule: true,
      default: {
        getNotificationById: jest.fn(() => Promise.resolve(null)),
        updateNotificationSeen: jest.fn(() => Promise.resolve({})),
      },
    };
  }
  return g.__TEST_PN_NOTIFICATIONS__;
});
jest.mock('../../src/services/notificationsService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_NOTIFICATIONS__?: {
      __esModule: boolean;
      default: {
        getNotificationById: jest.Mock;
        updateNotificationSeen: jest.Mock;
      };
    };
  };
  if (!g.__TEST_PN_NOTIFICATIONS__) {
    g.__TEST_PN_NOTIFICATIONS__ = {
      __esModule: true,
      default: {
        getNotificationById: jest.fn(() => Promise.resolve(null)),
        updateNotificationSeen: jest.fn(() => Promise.resolve({})),
      },
    };
  }
  return g.__TEST_PN_NOTIFICATIONS__;
});

jest.mock('@/services/rulesService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_RULES__?: { __esModule: boolean; default: { getRules: jest.Mock } };
  };
  if (!g.__TEST_PN_RULES__) {
    g.__TEST_PN_RULES__ = {
      __esModule: true,
      default: {
        getRules: jest.fn(() => Promise.resolve({ data: [] })),
      },
    };
  }
  return g.__TEST_PN_RULES__;
});
jest.mock('../../src/services/rulesService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_RULES__?: { __esModule: boolean; default: { getRules: jest.Mock } };
  };
  if (!g.__TEST_PN_RULES__) {
    g.__TEST_PN_RULES__ = {
      __esModule: true,
      default: {
        getRules: jest.fn(() => Promise.resolve({ data: [] })),
      },
    };
  }
  return g.__TEST_PN_RULES__;
});

jest.mock('@/services/appBadgeService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_BADGE__?: {
      getBadgeCount: jest.Mock;
      setBadgeCount: jest.Mock;
    };
  };
  if (!g.__TEST_PN_BADGE__) {
    g.__TEST_PN_BADGE__ = {
      getBadgeCount: jest.fn(() => Promise.resolve(0)),
      setBadgeCount: jest.fn(() => Promise.resolve()),
    };
  }
  return { __esModule: true, appBadgeService: g.__TEST_PN_BADGE__ };
});
jest.mock('../../src/services/appBadgeService', () => {
  const g = globalThis as typeof globalThis & {
    __TEST_PN_BADGE__?: {
      getBadgeCount: jest.Mock;
      setBadgeCount: jest.Mock;
    };
  };
  if (!g.__TEST_PN_BADGE__) {
    g.__TEST_PN_BADGE__ = {
      getBadgeCount: jest.fn(() => Promise.resolve(0)),
      setBadgeCount: jest.fn(() => Promise.resolve()),
    };
  }
  return { __esModule: true, appBadgeService: g.__TEST_PN_BADGE__ };
});
jest.mock('@/services/countDetectionEventService', () => {
  const actual = jest.requireActual(
    '@/services/countDetectionEventService'
  ) as typeof import('@/services/countDetectionEventService');
  return {
    ...actual,
    emitCountDetectionEvent: jest.fn(),
  };
});
jest.mock('@navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    dispatch: jest.fn(),
  },
}));
jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    navigate: jest.fn((params: object) => ({ type: 'NAVIGATE', payload: params })),
  },
  createNavigationContainerRef: jest.fn(() => ({ isReady: () => true, dispatch: jest.fn() })),
}));

// Use messaging() to get the singleton mock
const messaging = require('@react-native-firebase/messaging').default();
const notifee = require('@notifee/react-native');
const authService = require('@/services/authService');
const { emitCountDetectionEvent } = require('@/services/countDetectionEventService');
const { store } = require('@redux/store');
const { navigationRef } = require('@navigation/navigationRef');
const { Platform, PermissionsAndroid } = require('react-native');
const notificationsService = (globalThis as any).__TEST_PN_NOTIFICATIONS__.default;
const rulesService = (globalThis as any).__TEST_PN_RULES__.default;
const mockImageResizerApi = (globalThis as any).__TEST_PN_IMAGE_RESIZER__.default;
const appBadgeService = (globalThis as any).__TEST_PN_BADGE__;

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.getState.mockReturnValue({ auth: { accessToken: 'token', user: { id: 'user-1' } } });
    navigationRef.isReady.mockReturnValue(true);
  });

  describe('requestPermissionAndGetToken', () => {
    it('should return token when permission granted (android)', async () => {
      PermissionsAndroid.request.mockResolvedValue('granted');
      messaging.getToken.mockResolvedValue('fcm-token');
      messaging.requestPermission.mockResolvedValue(undefined);
      Platform.OS = 'android';
      Platform.Version = 33;
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBe('fcm-token');
      expect(PermissionsAndroid.request).toHaveBeenCalled();
      expect(messaging.getToken).toHaveBeenCalled();
    });

    it('should return null when permission denied (android)', async () => {
      PermissionsAndroid.request.mockResolvedValue('denied');
      Platform.OS = 'android';
      Platform.Version = 33;
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBeNull();
    });

    it('should return token when permission granted (ios)', async () => {
      messaging.requestPermission.mockResolvedValue(1);
      messaging.getToken.mockResolvedValue('fcm-token-ios');
      Platform.OS = 'ios';
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBe('fcm-token-ios');
      expect(messaging.requestPermission).toHaveBeenCalled();
      expect(messaging.getToken).toHaveBeenCalled();
    });

    it('should return null when permission denied (ios)', async () => {
      messaging.requestPermission.mockResolvedValue(3);
      Platform.OS = 'ios';
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBeNull();
    });

    it('should return token when iOS permission is provisional', async () => {
      messaging.requestPermission.mockResolvedValue(AuthorizationStatus.PROVISIONAL);
      messaging.getToken.mockResolvedValue('fcm-provisional');
      Platform.OS = 'ios';
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBe('fcm-provisional');
      expect(messaging.getToken).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      PermissionsAndroid.request.mockRejectedValue(new Error('fail'));
      Platform.OS = 'android';
      Platform.Version = 33;
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBeNull();
    });

    it('should skip POST_NOTIFICATIONS request on Android API below 33', async () => {
      Platform.OS = 'android';
      Platform.Version = 32;
      messaging.getToken.mockResolvedValue('fcm-token-low-api');
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBe('fcm-token-low-api');
      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    });

    it('should return null when getToken resolves empty', async () => {
      PermissionsAndroid.request.mockResolvedValue('granted');
      messaging.getToken.mockResolvedValue(null);
      Platform.OS = 'android';
      Platform.Version = 33;
      const token = await pushNotificationService.requestPermissionAndGetToken();
      expect(token).toBeNull();
    });
  });

  describe('registerTokenWithBackend', () => {
    it('should call updateProfile with device_token', async () => {
      await pushNotificationService.registerTokenWithBackend('fcm-token');
      expect(authService.updateProfile).toHaveBeenCalledWith({ device_token: 'fcm-token' });
    });

    it('should not call updateProfile if accessToken missing', async () => {
      store.getState.mockReturnValue({ auth: { accessToken: undefined } });
      await pushNotificationService.registerTokenWithBackend('fcm-token');
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle error gracefully', async () => {
      authService.updateProfile.mockRejectedValue(new Error('fail'));
      await pushNotificationService.registerTokenWithBackend('fcm-token');
      expect(authService.updateProfile).toHaveBeenCalled();
    });
  });

  describe('displayForegroundNotification', () => {
    it('should call notifee.createChannel and displayNotification', async () => {
      Platform.OS = 'android';
      const remoteMessage = {
        notification: { title: 'title', body: 'body' },
        data: {},
      };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.createChannel).toHaveBeenCalled();
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'title',
          body: 'body',
          android: expect.objectContaining({ channelId: 'fcm_default_channel' }),
        })
      );
    });

    it('should include image in notification when image_url in data', async () => {
      Platform.OS = 'android';
      const imageUrl = 'https://example.com/detection/image.webp';
      const remoteMessage = {
        notification: { title: 'TIMIMA', body: '【警告】未登録者が検知されました。' },
        data: { image_url: imageUrl },
      };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            style: {
              type: 'bigPicture',
              picture: imageUrl,
            },
          }),
        })
      );
    });

    it('should use fcm_options.image when image_url not present', async () => {
      Platform.OS = 'android';
      const imageUrl = 'https://camera001-stream.unlimited.io.vn/detection/image.webp';
      const remoteMessage = {
        notification: { title: 'TIMIMA', body: 'Alert' },
        data: { fcm_options: { image: imageUrl } },
      };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            style: expect.objectContaining({ picture: imageUrl }),
          }),
        })
      );
    });

    it('should handle error gracefully', async () => {
      Platform.OS = 'android';
      notifee.createChannel.mockRejectedValue(new Error('fail'));
      const remoteMessage = { notification: { title: 'title', body: 'body' }, data: {} };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.createChannel).toHaveBeenCalled();
    });

    it('should display notification with iOS config when on iOS', async () => {
      Platform.OS = 'ios';
      const remoteMessage = { notification: { title: 'title', body: 'body' }, data: {} };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'title',
          body: 'body',
          ios: expect.objectContaining({
            sound: 'default',
            foregroundPresentationOptions: expect.any(Object),
          }),
        })
      );
    });

    it('should include image attachment on iOS when image_url in data (converts webp to jpeg)', async () => {
      Platform.OS = 'ios';
      const imageUrl = 'https://example.com/image.webp';
      const remoteMessage = {
        notification: { title: 'title', body: 'body' },
        data: { image_url: imageUrl },
      };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          ios: expect.objectContaining({
            attachments: [{ url: expect.any(String), typeHint: 'public.jpeg' }],
          }),
        })
      );
    });

    it('should treat format=webp in image URL query as webp on iOS', async () => {
      const RNFS = require('react-native-fs');
      Platform.OS = 'ios';
      RNFS.downloadFile.mockReturnValue({ promise: Promise.resolve({ statusCode: 200 }) });
      mockImageResizerApi.createResizedImage.mockResolvedValue({
        uri: 'file:///cache/img.jpg',
        path: '/cache/img.jpg',
      });
      const url = 'https://example.com/img?format=webp';
      const remoteMessage = {
        notification: { title: 'title', body: 'body' },
        data: { image_url: url },
      };
      // @ts-ignore
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(RNFS.downloadFile).toHaveBeenCalled();
      expect(mockImageResizerApi.createResizedImage).toHaveBeenCalled();
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          ios: expect.objectContaining({
            attachments: [{ url: expect.any(String), typeHint: 'public.jpeg' }],
          }),
        })
      );
    });

    it('should not display notification when FCM data contains rule count keys (silent update)', async () => {
      Platform.OS = 'android';
      const remoteMessage = {
        notification: { title: 'title', body: 'body' },
        data: { visitor_count: '1' },
      };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).not.toHaveBeenCalled();
    });

    it('should use default i18n title when title is missing', async () => {
      Platform.OS = 'android';
      const remoteMessage = { data: { body: 'only body' } };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'pushNotification.defaultTitle',
          body: 'only body',
        })
      );
    });

    it('should use data.message as body when notification body is missing', async () => {
      Platform.OS = 'android';
      const remoteMessage = { notification: { title: 't' }, data: { message: 'from data' } };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'from data',
        })
      );
    });
  });

  describe('getNotificationImageUri (private)', () => {
    const RNFS = require('react-native-fs');

    beforeEach(() => {
      RNFS.downloadFile.mockImplementation(() => ({
        promise: Promise.resolve({ statusCode: 200 }),
      }));
      mockImageResizerApi.createResizedImage.mockImplementation(() =>
        Promise.resolve({ uri: 'file:///cache/img.jpg', path: '/cache/img.jpg' })
      );
    });

    it('returns empty string for empty URL', async () => {
      // @ts-ignore
      const uri = await pushNotificationService.getNotificationImageUri('');
      expect(uri).toBe('');
    });

    it('returns original URL on Android even for webp', async () => {
      Platform.OS = 'android';
      const url = 'https://example.com/x.webp';
      // @ts-ignore
      const uri = await pushNotificationService.getNotificationImageUri(url);
      expect(uri).toBe(url);
      expect(RNFS.downloadFile).not.toHaveBeenCalled();
    });

    it('returns original URL on iOS for non-webp images', async () => {
      Platform.OS = 'ios';
      const url = 'https://example.com/photo.jpg';
      // @ts-ignore
      const uri = await pushNotificationService.getNotificationImageUri(url);
      expect(uri).toBe(url);
      expect(RNFS.downloadFile).not.toHaveBeenCalled();
    });

    it('falls back to original URL when webp conversion fails on iOS', async () => {
      Platform.OS = 'ios';
      mockImageResizerApi.createResizedImage.mockRejectedValueOnce(new Error('convert fail'));
      const url = 'https://example.com/fail.webp';
      // @ts-ignore
      const uri = await pushNotificationService.getNotificationImageUri(url);
      expect(uri).toBe(url);
    });
  });

  describe('handleNotificationOpened (private)', () => {
    beforeEach(() => {
      navigationRef.dispatch.mockClear();
      notificationsService.updateNotificationSeen.mockImplementation(() =>
        Promise.resolve({
          id: 'n1',
          camera_id: 'cam-1',
          rules_master_id: 'rm-1',
          sent_at: '2024-01-15T10:00:00Z',
        })
      );
      rulesService.getRules.mockImplementation(() =>
        Promise.resolve({
          data: [{ id: 'rm-1', code: 'visitor_count', rule_name: 'Visitors' }],
        })
      );
    });

    it('does nothing when navigation is not ready', async () => {
      navigationRef.isReady.mockReturnValue(false);
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(navigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('does nothing when user id is missing', async () => {
      store.getState.mockReturnValue({ auth: { accessToken: 'token', user: null } });
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(navigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('navigates to Notifications when there is no notification id', async () => {
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({});
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('navigates to ListNotificationCamera when notification resolves with camera and rule', async () => {
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(notificationsService.updateNotificationSeen).toHaveBeenCalledWith('n1', true);
      expect(rulesService.getRules).toHaveBeenCalled();
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('navigates to CustomerReport for customer_attribute_report rule', async () => {
      rulesService.getRules.mockResolvedValue({
        data: [{ id: 'rm-1', code: 'customer_attribute_report', rule_name: 'Customer attrs' }],
      });
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('decrements badge on iOS after marking notification seen', async () => {
      Platform.OS = 'ios';
      appBadgeService.getBadgeCount.mockResolvedValue(4);
      appBadgeService.setBadgeCount.mockResolvedValue(undefined);
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(appBadgeService.getBadgeCount).toHaveBeenCalled();
      expect(appBadgeService.setBadgeCount).toHaveBeenCalledWith(3);
    });

    it('falls back to Notifications when updateNotificationSeen fails', async () => {
      notificationsService.updateNotificationSeen.mockRejectedValueOnce(new Error('api error'));
      // @ts-ignore
      await pushNotificationService.handleNotificationOpened({ notification_id: 'n1' });
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });
  });

  describe('init', () => {
    it('should call requestPermissionAndGetToken and registerTokenWithBackend', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('token');
      pushNotificationService.registerTokenWithBackend = jest.fn().mockResolvedValue(undefined);
      messaging.onMessage.mockImplementation((cb: (arg0: {}) => void) => {
        cb({});
        return jest.fn();
      });
      messaging.onNotificationOpenedApp.mockImplementation((cb: (arg0: {}) => void) => {
        cb({});
        return jest.fn();
      });
      messaging.onTokenRefresh.mockImplementation((cb: (arg0: string) => void) => {
        cb('token');
        return jest.fn();
      });
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(pushNotificationService.requestPermissionAndGetToken).toHaveBeenCalled();
      expect(pushNotificationService.registerTokenWithBackend).toHaveBeenCalledWith('token');
    });

    it('should handle error gracefully', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest
        .fn()
        .mockRejectedValue(new Error('fail'));
      await pushNotificationService.init();
      expect(pushNotificationService.requestPermissionAndGetToken).toHaveBeenCalled();
    });

    it('should emit count detection event when foreground message has rule keys in data', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('token');
      pushNotificationService.registerTokenWithBackend = jest.fn().mockResolvedValue(undefined);
      messaging.onMessage.mockImplementation(
        (cb: (msg: { data?: Record<string, string> }) => void) => {
          cb({
            data: { visitor_count: '1', camera_id: 'camera-99' },
          });
          return jest.fn();
        }
      );
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(emitCountDetectionEvent).toHaveBeenCalledWith({
        codes: ['visitor_count'],
        camera_id: 'camera-99',
      });
    });

    it('should emit enterprise_attendance_in/out from nested JSON string in enterprise_attendance', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('token');
      pushNotificationService.registerTokenWithBackend = jest.fn().mockResolvedValue(undefined);
      messaging.onMessage.mockImplementation(
        (cb: (msg: { data?: Record<string, unknown> }) => void) => {
          cb({
            data: {
              enterprise_attendance: '{"in":1,"out":1}',
              camera_id: 'cam-1',
            },
          });
          return jest.fn();
        }
      );
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(emitCountDetectionEvent).toHaveBeenCalledWith({
        codes: ['enterprise_attendance_in', 'enterprise_attendance_out'],
        camera_id: 'cam-1',
      });
    });

    it('should emit only enterprise_attendance_out when nested JSON has out only', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('token');
      pushNotificationService.registerTokenWithBackend = jest.fn().mockResolvedValue(undefined);
      messaging.onMessage.mockImplementation(
        (cb: (msg: { data?: Record<string, unknown> }) => void) => {
          cb({
            data: {
              enterprise_attendance: '{"out":1}',
              camera_id: 'cam-2',
            },
          });
          return jest.fn();
        }
      );
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(emitCountDetectionEvent).toHaveBeenCalledWith({
        codes: ['enterprise_attendance_out'],
        camera_id: 'cam-2',
      });
    });

    it('should not emit count when enterprise_attendance is all zeros or empty', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('token');
      pushNotificationService.registerTokenWithBackend = jest.fn().mockResolvedValue(undefined);
      messaging.onMessage.mockImplementation(
        (cb: (msg: { data?: Record<string, unknown> }) => void) => {
          cb({
            data: {
              enterprise_attendance: '{"in":0,"out":0}',
              camera_id: 'cam-0',
            },
          });
          return jest.fn();
        }
      );
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(emitCountDetectionEvent).not.toHaveBeenCalled();
    });

    it('should call all unsubscribe handlers on cleanup', async () => {
      const unsubMsg = jest.fn();
      const unsubOpened = jest.fn();
      const unsubNotifee = jest.fn();
      const unsubToken = jest.fn();
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(unsubMsg);
      messaging.onNotificationOpenedApp.mockReturnValue(unsubOpened);
      notifee.onForegroundEvent.mockReturnValue(unsubNotifee);
      messaging.onTokenRefresh.mockReturnValue(unsubToken);
      messaging.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      pushNotificationService.cleanup();
      expect(unsubMsg).toHaveBeenCalled();
      expect(unsubOpened).toHaveBeenCalled();
      expect(unsubNotifee).toHaveBeenCalled();
      expect(unsubToken).toHaveBeenCalled();
    });

    it('should read Firebase initial notification then Notifee when Firebase has no data', async () => {
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(jest.fn());
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      notifee.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(messaging.getInitialNotification).toHaveBeenCalled();
      expect(notifee.getInitialNotification).toHaveBeenCalled();
    });

    it('should register refreshed token when onTokenRefresh fires', async () => {
      const registerSpy = jest.fn().mockResolvedValue(undefined);
      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue('first');
      pushNotificationService.registerTokenWithBackend = registerSpy;
      messaging.onMessage.mockReturnValue(jest.fn());
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockImplementation((cb: (t: string) => void) => {
        cb('refreshed-fcm');
        return jest.fn();
      });
      messaging.getInitialNotification.mockResolvedValue(null);
      notifee.getInitialNotification.mockResolvedValue(null);
      await pushNotificationService.init();
      expect(registerSpy).toHaveBeenCalledWith('first');
      expect(registerSpy).toHaveBeenCalledWith('refreshed-fcm');
    });

    it('should await handleNotificationOpened when opened from Firebase cold start', async () => {
      store.getState.mockReturnValue({
        auth: { accessToken: 't', user: { id: 'u1' } },
      });
      notificationsService.updateNotificationSeen.mockResolvedValue({
        camera_id: 'c1',
        rules_master_id: 'rm1',
      });
      rulesService.getRules.mockResolvedValue({
        data: [{ id: 'rm1', code: 'daily_passerby', rule_name: 'Pass' }],
      });
      navigationRef.dispatch.mockClear();

      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(jest.fn());
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue({
        data: { notification_id: 'cold-n' },
      });
      notifee.getInitialNotification.mockResolvedValue(null);

      await pushNotificationService.init();
      expect(notificationsService.updateNotificationSeen).toHaveBeenCalledWith('cold-n', true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('should handle Notifee cold start when Firebase initial has no data', async () => {
      store.getState.mockReturnValue({
        auth: { accessToken: 't', user: { id: 'u1' } },
      });
      notificationsService.updateNotificationSeen.mockResolvedValue({
        camera_id: 'c2',
        rules_master_id: 'rm2',
      });
      rulesService.getRules.mockResolvedValue({
        data: [{ id: 'rm2', code: 'visitor_count', rule_name: 'V' }],
      });
      navigationRef.dispatch.mockClear();

      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(jest.fn());
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      notifee.getInitialNotification.mockResolvedValue({
        notification: { data: { notification_id: 'notifee-cold' } },
      });

      await pushNotificationService.init();
      expect(notificationsService.updateNotificationSeen).toHaveBeenCalledWith(
        'notifee-cold',
        true
      );
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('should invoke handleNotificationOpened when user opens app from background via Firebase', async () => {
      store.getState.mockReturnValue({
        auth: { accessToken: 't', user: { id: 'u1' } },
      });
      notificationsService.updateNotificationSeen.mockResolvedValue({
        camera_id: 'c1',
        rules_master_id: 'rm1',
      });
      rulesService.getRules.mockResolvedValue({
        data: [{ id: 'rm1', code: 'visitor_count', rule_name: 'V' }],
      });

      let openedHandler: (msg: { data?: Record<string, string> }) => void = () => {};
      messaging.onNotificationOpenedApp.mockImplementation((cb: typeof openedHandler) => {
        openedHandler = cb;
        return jest.fn();
      });

      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(jest.fn());
      notifee.onForegroundEvent.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      notifee.getInitialNotification.mockResolvedValue(null);
      navigationRef.dispatch.mockClear();

      await pushNotificationService.init();
      openedHandler({ data: { notification_id: 'bg-1' } });
      await Promise.resolve();
      await Promise.resolve();
      await new Promise<void>((r) => setImmediate(r));

      expect(notificationsService.updateNotificationSeen).toHaveBeenCalledWith('bg-1', true);
    });

    it('should invoke handleNotificationOpened on Notifee foreground press with data', async () => {
      store.getState.mockReturnValue({
        auth: { accessToken: 't', user: { id: 'u1' } },
      });
      notificationsService.updateNotificationSeen.mockResolvedValue({
        camera_id: 'c1',
        rules_master_id: 'rm1',
      });
      rulesService.getRules.mockResolvedValue({
        data: [{ id: 'rm1', code: 'visitor_count', rule_name: 'V' }],
      });

      let notifeeEventHandler: (ev: {
        type: number;
        detail: { notification?: { data?: object } };
      }) => void = () => {};
      notifee.onForegroundEvent.mockImplementation((cb: typeof notifeeEventHandler) => {
        notifeeEventHandler = cb;
        return jest.fn();
      });

      pushNotificationService.requestPermissionAndGetToken = jest.fn().mockResolvedValue(null);
      pushNotificationService.registerTokenWithBackend = jest.fn();
      messaging.onMessage.mockReturnValue(jest.fn());
      messaging.onNotificationOpenedApp.mockReturnValue(jest.fn());
      messaging.onTokenRefresh.mockReturnValue(jest.fn());
      messaging.getInitialNotification.mockResolvedValue(null);
      notifee.getInitialNotification.mockResolvedValue(null);

      await pushNotificationService.init();
      notifeeEventHandler({
        type: 1,
        detail: { notification: { data: { notification_id: 'press-1' } } },
      });
      await Promise.resolve();
      await Promise.resolve();
      await new Promise<void>((r) => setImmediate(r));

      expect(notificationsService.updateNotificationSeen).toHaveBeenCalledWith('press-1', true);
    });
  });

  describe('deleteToken', () => {
    it('should call messaging.deleteToken', async () => {
      messaging.deleteToken.mockResolvedValue(undefined);
      await pushNotificationService.deleteToken();
      expect(messaging.deleteToken).toHaveBeenCalled();
    });

    it('should handle error gracefully', async () => {
      messaging.deleteToken.mockRejectedValue(new Error('fail'));
      await pushNotificationService.deleteToken();
      expect(messaging.deleteToken).toHaveBeenCalled();
    });
  });
});
