import * as permissionsUtils from '../../src/utils/permissions';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: { openSettings: jest.fn() },
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
  PERMISSIONS: {
    IOS: { MICROPHONE: 'ios-mic' },
    ANDROID: { RECORD_AUDIO: 'android-mic' },
  },
}));

describe('permissions utils', () => {
  const rnPermissions = require('react-native-permissions');
  const rn = require('react-native');

  describe('checkMicPermission', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns granted when permission is granted (iOS)', async () => {
      rn.Platform.OS = 'ios';
      rnPermissions.check.mockResolvedValue(rnPermissions.RESULTS.GRANTED);
      const result = await permissionsUtils.checkMicPermission();
      expect(rnPermissions.check).toHaveBeenCalledWith(rnPermissions.PERMISSIONS.IOS.MICROPHONE);
      expect(result).toBe('granted');
    });

    it('returns denied when permission is denied (Android)', async () => {
      rn.Platform.OS = 'android';
      rnPermissions.check.mockResolvedValue(rnPermissions.RESULTS.DENIED);
      const result = await permissionsUtils.checkMicPermission();
      expect(rnPermissions.check).toHaveBeenCalledWith(
        rnPermissions.PERMISSIONS.ANDROID.RECORD_AUDIO
      );
      expect(result).toBe('denied');
    });

    it('returns blocked when permission is blocked', async () => {
      rn.Platform.OS = 'ios';
      rnPermissions.check.mockResolvedValue(rnPermissions.RESULTS.BLOCKED);
      const result = await permissionsUtils.checkMicPermission();
      expect(result).toBe('blocked');
    });

    it('returns unavailable for other statuses', async () => {
      rn.Platform.OS = 'android';
      rnPermissions.check.mockResolvedValue('something-else');
      const result = await permissionsUtils.checkMicPermission();
      expect(result).toBe('unavailable');
    });
  });

  describe('requestMicPermission', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns granted when permission is granted (iOS)', async () => {
      rn.Platform.OS = 'ios';
      rnPermissions.request.mockResolvedValue(rnPermissions.RESULTS.GRANTED);
      const result = await permissionsUtils.requestMicPermission();
      expect(rnPermissions.request).toHaveBeenCalledWith(rnPermissions.PERMISSIONS.IOS.MICROPHONE);
      expect(result).toBe('granted');
    });

    it('returns denied when permission is denied (Android)', async () => {
      rn.Platform.OS = 'android';
      rnPermissions.request.mockResolvedValue(rnPermissions.RESULTS.DENIED);
      const result = await permissionsUtils.requestMicPermission();
      expect(rnPermissions.request).toHaveBeenCalledWith(
        rnPermissions.PERMISSIONS.ANDROID.RECORD_AUDIO
      );
      expect(result).toBe('denied');
    });

    it('returns blocked when permission is blocked', async () => {
      rn.Platform.OS = 'ios';
      rnPermissions.request.mockResolvedValue(rnPermissions.RESULTS.BLOCKED);
      const result = await permissionsUtils.requestMicPermission();
      expect(result).toBe('blocked');
    });

    it('returns unavailable for other statuses', async () => {
      rn.Platform.OS = 'android';
      rnPermissions.request.mockResolvedValue('something-else');
      const result = await permissionsUtils.requestMicPermission();
      expect(result).toBe('unavailable');
    });
  });

  describe('openAppSettings', () => {
    it('calls Linking.openSettings', () => {
      permissionsUtils.openAppSettings();
      expect(rn.Linking.openSettings).toHaveBeenCalled();
    });
  });
});
