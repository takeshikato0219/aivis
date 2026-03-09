import { BaseLineService } from '../../src/api/baseLineService';

const mockSetup = jest.fn();
const mockGetCurrentAccessToken = jest.fn();
const mockGetProfile = jest.fn();

jest.mock('@xmartlabs/react-native-line', () => ({
  setup: (...args: any[]) => mockSetup(...args),
  getCurrentAccessToken: (...args: any[]) => mockGetCurrentAccessToken(...args),
  getProfile: (...args: any[]) => mockGetProfile(...args),
}));

const mockCanOpenURL = jest.fn();
jest.mock('react-native', () => ({
  Linking: { canOpenURL: (...args: any[]) => mockCanOpenURL(...args) },
}));

describe('BaseLineService', () => {
  class TestLineService extends BaseLineService {}
  let service: TestLineService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global flag for each test
    (global as any).isLineSdkConfigured = false;
    service = new TestLineService();
  });

  it('should call Line.setup only once (singleton)', async () => {
    mockSetup.mockResolvedValueOnce(undefined);
    // @ts-ignore
    await service.configure();
    // @ts-ignore
    await service.configure();
    expect(mockSetup).toHaveBeenCalledTimes(1);
  });

  it('isSignedIn returns true if accessToken exists', async () => {
    mockGetCurrentAccessToken.mockResolvedValueOnce({ accessToken: 'token' });
    await expect(service.isSignedIn()).resolves.toBe(true);
  });

  it('isSignedIn returns false if no accessToken', async () => {
    mockGetCurrentAccessToken.mockResolvedValueOnce({});
    await expect(service.isSignedIn()).resolves.toBe(false);
  });

  it('isSignedIn returns false on error', async () => {
    mockGetCurrentAccessToken.mockRejectedValueOnce(new Error('fail'));
    await expect(service.isSignedIn()).resolves.toBe(false);
  });

  it('isLineAppInstalled returns true if canOpenURL resolves true', async () => {
    mockCanOpenURL.mockResolvedValueOnce(true);
    // @ts-ignore
    await expect(service.isLineAppInstalled()).resolves.toBe(true);
  });

  it('isLineAppInstalled returns false if canOpenURL resolves false', async () => {
    mockCanOpenURL.mockResolvedValueOnce(false);
    // @ts-ignore
    await expect(service.isLineAppInstalled()).resolves.toBe(false);
  });

  it('isLineAppInstalled returns false on error', async () => {
    mockCanOpenURL.mockRejectedValueOnce(new Error('fail'));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    // @ts-ignore
    await expect(service.isLineAppInstalled()).resolves.toBe(false);
    expect(spy).toHaveBeenCalledWith(
      '[LINE] Error checking LINE app installation:',
      expect.any(Error)
    );
    spy.mockRestore();
  });

  it('getCurrentUser returns profile if successful', async () => {
    mockGetProfile.mockResolvedValueOnce({ id: '1', displayName: 'Test' });
    await expect(service.getCurrentUser()).resolves.toEqual({ id: '1', displayName: 'Test' });
  });

  it('getCurrentUser returns null and logs error on failure', async () => {
    mockGetProfile.mockRejectedValueOnce(new Error('fail'));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await expect(service.getCurrentUser()).resolves.toBeNull();
    expect(spy).toHaveBeenCalledWith('[LINE] Failed to get current user:', expect.any(Error));
    spy.mockRestore();
  });
});
