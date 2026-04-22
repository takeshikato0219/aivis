import { appBadgeService } from '@/services/appBadgeService';

const mockSetBadgeCount = jest.fn();
const mockGetBadgeCount = jest.fn();

jest.mock('@notifee/react-native', () => ({
  setBadgeCount: (...args: unknown[]) => mockSetBadgeCount(...args),
  getBadgeCount: (...args: unknown[]) => mockGetBadgeCount(...args),
}));

const mockApplyCount = jest.fn();
const mockRemoveCount = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' as string },
  NativeModules: {
    ShortcutBadger: {
      applyCount: (...args: unknown[]) => mockApplyCount(...args),
      removeCount: (...args: unknown[]) => mockRemoveCount(...args),
    },
  },
}));

const { Platform, NativeModules } = require('react-native');

describe('appBadgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockSetBadgeCount.mockResolvedValue(undefined);
    mockGetBadgeCount.mockResolvedValue(0);
    NativeModules.ShortcutBadger = {
      applyCount: mockApplyCount,
      removeCount: mockRemoveCount,
    };
  });

  describe('setBadgeCount', () => {
    it('clamps count to 0–99 before calling notifee on iOS', async () => {
      await appBadgeService.setBadgeCount(-3);
      expect(mockSetBadgeCount).toHaveBeenCalledWith(0);

      await appBadgeService.setBadgeCount(200);
      expect(mockSetBadgeCount).toHaveBeenCalledWith(99);
    });

    it('calls notifee.setBadgeCount on iOS', async () => {
      await appBadgeService.setBadgeCount(7);
      expect(mockSetBadgeCount).toHaveBeenCalledWith(7);
    });

    it('uses ShortcutBadger.applyCount on Android when count > 0', async () => {
      Platform.OS = 'android';

      await appBadgeService.setBadgeCount(12);

      expect(mockApplyCount).toHaveBeenCalledWith(12);
      expect(mockRemoveCount).not.toHaveBeenCalled();
      expect(mockSetBadgeCount).not.toHaveBeenCalled();
    });

    it('calls ShortcutBadger.removeCount on Android when count is 0', async () => {
      Platform.OS = 'android';

      await appBadgeService.setBadgeCount(0);

      expect(mockRemoveCount).toHaveBeenCalled();
      expect(mockApplyCount).not.toHaveBeenCalled();
    });

    it('does not call ShortcutBadger when Android has no ShortcutBadger module', async () => {
      Platform.OS = 'android';
      NativeModules.ShortcutBadger = null;

      await appBadgeService.setBadgeCount(5);

      expect(mockApplyCount).not.toHaveBeenCalled();
      expect(mockRemoveCount).not.toHaveBeenCalled();
    });

    it('logs warning when notifee.setBadgeCount throws on iOS', async () => {
      mockSetBadgeCount.mockRejectedValueOnce(new Error('badge fail'));
      const warn = jest.spyOn(console, 'warn').mockImplementation();

      await appBadgeService.setBadgeCount(1);

      expect(warn).toHaveBeenCalledWith('[AppBadge] setBadgeCount error:', expect.any(Error));
      warn.mockRestore();
    });
  });

  describe('getBadgeCount', () => {
    it('returns 0 on non-iOS without calling notifee', async () => {
      Platform.OS = 'android';

      const n = await appBadgeService.getBadgeCount();

      expect(n).toBe(0);
      expect(mockGetBadgeCount).not.toHaveBeenCalled();
    });

    it('returns notifee.getBadgeCount on iOS', async () => {
      mockGetBadgeCount.mockResolvedValue(4);

      const n = await appBadgeService.getBadgeCount();

      expect(mockGetBadgeCount).toHaveBeenCalled();
      expect(n).toBe(4);
    });

    it('returns 0 when notifee.getBadgeCount throws on iOS', async () => {
      mockGetBadgeCount.mockRejectedValueOnce(new Error('fail'));

      const n = await appBadgeService.getBadgeCount();

      expect(n).toBe(0);
    });
  });
});
