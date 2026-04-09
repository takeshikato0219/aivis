import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import i18n from '@/i18n';
import appleAuthService from '@/services/appleAuthService';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@invertase/react-native-apple-authentication', () => {
  const performRequest = jest.fn();
  return {
    __esModule: true,
    default: {
      isSupported: true,
      performRequest,
      Operation: { LOGIN: 1 },
      Scope: { EMAIL: 0, FULL_NAME: 1 },
      Error: { CANCELED: '1001' },
    },
  };
});

jest.mock('@/i18n', () => ({
  t: jest.fn((key: string) => key),
}));

const i18nTranslations: Record<string, string> = {
  'auth.appleSignInNotAvailable': 'Sign in with Apple is not available on this device',
  'auth.appleSignInFailed': 'Apple sign in failed',
  'auth.userCancelledLogin': 'User cancelled login',
};

describe('AppleAuthService', () => {
  const mockAppleAuth = appleAuth as typeof appleAuth & {
    isSupported: boolean;
    performRequest: jest.Mock;
  };
  // @ts-ignore
  const mockT = i18n.t as jest.Mock;

  beforeEach(() => {
    // jest.setup.js runs clearAllMocks globally; restore i18n.t implementation
    mockT.mockImplementation((key: string) => i18nTranslations[key] || key);
    Platform.OS = 'ios';
    mockAppleAuth.isSupported = true;
    mockAppleAuth.performRequest.mockReset();
  });

  describe('signIn', () => {
    it('throws when not on iOS', async () => {
      Platform.OS = 'android';

      await expect(appleAuthService.signIn()).rejects.toThrow(
        'Sign in with Apple is not available on this device'
      );
      expect(mockT).toHaveBeenCalledWith('auth.appleSignInNotAvailable');
      expect(mockAppleAuth.performRequest).not.toHaveBeenCalled();
    });

    it('throws when Apple Sign In is not supported on the device', async () => {
      mockAppleAuth.isSupported = false;

      await expect(appleAuthService.signIn()).rejects.toThrow(
        'Sign in with Apple is not available on this device'
      );
      expect(mockT).toHaveBeenCalledWith('auth.appleSignInNotAvailable');
      expect(mockAppleAuth.performRequest).not.toHaveBeenCalled();
    });

    it('calls performRequest with login and email/full name scopes', async () => {
      mockAppleAuth.performRequest.mockResolvedValue({
        identityToken: 'token-abc',
        fullName: { givenName: 'A', familyName: 'B' },
      });

      await appleAuthService.signIn();

      expect(mockAppleAuth.performRequest).toHaveBeenCalledWith({
        requestedOperation: mockAppleAuth.Operation.LOGIN,
        requestedScopes: [mockAppleAuth.Scope.EMAIL, mockAppleAuth.Scope.FULL_NAME],
      });
    });

    it('returns idToken and name fields on success', async () => {
      mockAppleAuth.performRequest.mockResolvedValue({
        identityToken: 'id.jwt',
        fullName: { givenName: 'Jane', familyName: 'Doe' },
      });

      const result = await appleAuthService.signIn();

      expect(result).toEqual({
        idToken: 'id.jwt',
        givenName: 'Jane',
        familyName: 'Doe',
      });
    });

    it('maps missing fullName to null', async () => {
      mockAppleAuth.performRequest.mockResolvedValue({
        identityToken: 'id.jwt',
        fullName: undefined,
      });

      const result = await appleAuthService.signIn();

      expect(result).toEqual({
        idToken: 'id.jwt',
        givenName: null,
        familyName: null,
      });
    });

    it('throws when identityToken is missing', async () => {
      mockAppleAuth.performRequest.mockResolvedValue({
        identityToken: null,
        fullName: null,
      });

      await expect(appleAuthService.signIn()).rejects.toThrow('Apple sign in failed');
      expect(mockT).toHaveBeenCalledWith('auth.appleSignInFailed');
    });

    it('maps Apple user cancellation to localized error', async () => {
      mockAppleAuth.performRequest.mockRejectedValue({ code: mockAppleAuth.Error.CANCELED });

      await expect(appleAuthService.signIn()).rejects.toThrow('User cancelled login');
      expect(mockT).toHaveBeenCalledWith('auth.userCancelledLogin');
    });

    it('rethrows with original message when present', async () => {
      mockAppleAuth.performRequest.mockRejectedValue(new Error('Network down'));

      await expect(appleAuthService.signIn()).rejects.toThrow('Network down');
    });

    it('uses generic failure message when error has no message', async () => {
      mockAppleAuth.performRequest.mockRejectedValue({});

      await expect(appleAuthService.signIn()).rejects.toThrow('Apple sign in failed');
      expect(mockT).toHaveBeenCalledWith('auth.appleSignInFailed');
    });
  });
});
