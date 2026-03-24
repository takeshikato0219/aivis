import { pushNotificationService } from '../../src/services/pushNotificationService';

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
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  default: {
    createResizedImage: jest.fn(() =>
      Promise.resolve({ uri: 'file:///cache/img.jpg', path: '/cache/img.jpg' })
    ),
  },
}));
jest.mock('@/services/notificationsService', () => ({
  default: {
    getNotificationById: jest.fn(() => Promise.resolve(null)),
    updateNotificationSeen: jest.fn(() => Promise.resolve({})),
  },
}));
jest.mock('@/services/rulesService', () => ({
  default: {
    getRules: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));
jest.mock('@/services/appBadgeService', () => ({
  appBadgeService: {
    getBadgeCount: jest.fn(() => Promise.resolve(0)),
    setBadgeCount: jest.fn(() => Promise.resolve()),
  },
}));
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
const { store } = require('@redux/store');
const { Platform, PermissionsAndroid } = require('react-native');

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.getState.mockReturnValue({ auth: { accessToken: 'token' } });
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

    it('should return null on error', async () => {
      PermissionsAndroid.request.mockRejectedValue(new Error('fail'));
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
