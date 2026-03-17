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
  AndroidImportance: { HIGH: 4 },
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33 },
  PermissionsAndroid: {
    request: jest.fn(),
    PERMISSIONS: { POST_NOTIFICATIONS: 'POST_NOTIFICATIONS' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
  },
}));
jest.mock('@/i18n', () => ({ t: (key: string) => key }));
jest.mock('@/services/authService', () => ({ updateProfile: jest.fn() }));
jest.mock('@redux/store', () => ({ store: { getState: jest.fn() } }));

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

    it('should handle error gracefully', async () => {
      Platform.OS = 'android';
      notifee.createChannel.mockRejectedValue(new Error('fail'));
      const remoteMessage = { notification: { title: 'title', body: 'body' }, data: {} };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.createChannel).toHaveBeenCalled();
    });

    it('should not call notifee on iOS', async () => {
      Platform.OS = 'ios';
      const remoteMessage = { notification: { title: 'title', body: 'body' }, data: {} };
      // @ts-ignore: Accessing private method for test coverage
      await pushNotificationService.displayForegroundNotification(remoteMessage);
      expect(notifee.createChannel).not.toHaveBeenCalled();
      expect(notifee.displayNotification).not.toHaveBeenCalled();
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
