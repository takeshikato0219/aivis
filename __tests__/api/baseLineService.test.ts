// ─── mocks declared at module scope so jest.mock factories can reference them ───
const mockSetup = jest.fn();
const mockGetCurrentAccessToken = jest.fn();
const mockGetProfile = jest.fn();

jest.mock('@xmartlabs/react-native-line', () => ({
  setup: (...args: any[]) => mockSetup(...args),
  getCurrentAccessToken: (...args: any[]) => mockGetCurrentAccessToken(...args),
  getProfile: (...args: any[]) => mockGetProfile(...args),
}));

jest.mock('react-native', () => ({
  Linking: { canOpenURL: jest.fn() },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const freshService = () => {
  jest.resetModules();

  const { BaseLineService } = require('@/services/baseLineService');
  class TestLineService extends BaseLineService {}
  return new TestLineService() as InstanceType<typeof BaseLineService>;
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('BaseLineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── configure / singleton ──────────────────────────────────────────────────

  describe('configure()', () => {
    it('should call Line.setup with the correct channelId', async () => {
      mockSetup.mockResolvedValueOnce(undefined);
      const service = freshService();
      // Constructor fires configure(); wait for it
      await (service as any).configure();
      expect(mockSetup).toHaveBeenCalledWith({ channelId: '2009814613' });
    });

    it('should call Line.setup only once (singleton guard)', async () => {
      mockSetup.mockResolvedValue(undefined);
      const service = freshService();
      await (service as any).configure();
      await (service as any).configure();
      // Constructor + 2 explicit calls → still only 1 native call
      expect(mockSetup).toHaveBeenCalledTimes(1);
    });

    it('should set configured flag when setup throws "already completed" error', async () => {
      mockSetup.mockRejectedValueOnce(new Error('setup already completed'));
      const service = freshService();
      await (service as any).configure();
      // Second call must be skipped (flag set to true despite error)
      mockSetup.mockResolvedValue(undefined);
      await (service as any).configure();
      expect(mockSetup).toHaveBeenCalledTimes(1);
    });

    it('should log and not set flag when setup throws an unrecognised error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSetup.mockRejectedValueOnce(new Error('some other error'));
      const service = freshService();
      await (service as any).configure();
      expect(consoleSpy).toHaveBeenCalledWith('[LINE] Setup error caught:', expect.any(Error));
      // Flag NOT set → second call should try again
      mockSetup.mockResolvedValueOnce(undefined);
      await (service as any).configure();
      expect(mockSetup).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    it('should deduplicate concurrent configure() calls via in-flight promise', async () => {
      let resolveSetup!: () => void;
      mockSetup.mockReturnValueOnce(
        new Promise<void>((res) => {
          resolveSetup = res;
        })
      );
      const service = freshService();
      // Fire two concurrent configure() calls
      const p1 = (service as any).configure();
      const p2 = (service as any).configure();
      resolveSetup();
      await Promise.all([p1, p2]);
      // Native setup must be called exactly once despite two concurrent callers
      expect(mockSetup).toHaveBeenCalledTimes(1);
    });

    it('constructor should trigger configure() automatically', async () => {
      mockSetup.mockResolvedValueOnce(undefined);
      freshService();
      // Allow microtask queue to flush
      await Promise.resolve();
      expect(mockSetup).toHaveBeenCalledTimes(1);
    });
  });

  // ── isSignedIn ─────────────────────────────────────────────────────────────

  describe('isSignedIn()', () => {
    it('should return true when accessToken exists', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetCurrentAccessToken.mockResolvedValueOnce({ accessToken: 'token' });
      const service = freshService();
      await expect(service.isSignedIn()).resolves.toBe(true);
    });

    it('should return false when accessToken is absent', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetCurrentAccessToken.mockResolvedValueOnce({});
      const service = freshService();
      await expect(service.isSignedIn()).resolves.toBe(false);
    });

    it('should return false when accessToken is null', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetCurrentAccessToken.mockResolvedValueOnce(null);
      const service = freshService();
      await expect(service.isSignedIn()).resolves.toBe(false);
    });

    it('should return false on error', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetCurrentAccessToken.mockRejectedValueOnce(new Error('fail'));
      const service = freshService();
      await expect(service.isSignedIn()).resolves.toBe(false);
    });
  });

  // ── isLineAppInstalled ─────────────────────────────────────────────────────

  describe('isLineAppInstalled()', () => {
    it('should return true when canOpenURL resolves true', async () => {
      mockSetup.mockResolvedValue(undefined);
      const service = freshService();
      // Must require react-native AFTER freshService() to get the same mock instance

      const { Linking: FreshLinking } = require('react-native');
      (FreshLinking.canOpenURL as jest.Mock).mockResolvedValueOnce(true);
      await expect((service as any).isLineAppInstalled()).resolves.toBe(true);
      expect(FreshLinking.canOpenURL).toHaveBeenCalledWith('line://');
    });

    it('should return false when canOpenURL resolves false', async () => {
      mockSetup.mockResolvedValue(undefined);
      const service = freshService();

      const { Linking: FreshLinking } = require('react-native');
      (FreshLinking.canOpenURL as jest.Mock).mockResolvedValueOnce(false);
      await expect((service as any).isLineAppInstalled()).resolves.toBe(false);
    });

    it('should return false and log error when canOpenURL throws', async () => {
      mockSetup.mockResolvedValue(undefined);
      const service = freshService();

      const { Linking: FreshLinking } = require('react-native');
      (FreshLinking.canOpenURL as jest.Mock).mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await expect((service as any).isLineAppInstalled()).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[LINE] Error checking LINE app installation:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  // ── getCurrentUser ─────────────────────────────────────────────────────────

  describe('getCurrentUser()', () => {
    it('should return profile on success', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetProfile.mockResolvedValueOnce({ userId: '1', displayName: 'Test' });
      const service = freshService();
      await expect(service.getCurrentUser()).resolves.toEqual({
        userId: '1',
        displayName: 'Test',
      });
    });

    it('should return null and log error on failure', async () => {
      mockSetup.mockResolvedValue(undefined);
      mockGetProfile.mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const service = freshService();
      await expect(service.getCurrentUser()).resolves.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[LINE] Failed to get current user:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
