import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import i18n from '@/i18n';
import { GoogleAuthService, GoogleSignInResponse } from '../../src/api/googleAuthService';

// Mock dependencies
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    revokeAccess: jest.fn(),
    getTokens: jest.fn(),
    clearCachedAccessToken: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('@/i18n', () => ({
  t: jest.fn().mockImplementation((key: string) => {
    const translations: Record<string, string> = {
      'auth.userCancelledLogin': 'User cancelled login',
      'auth.loginIsInProgress': 'Login is in progress',
      'auth.googlePlayServicesAreNotAvailable': 'Google Play Services are not available',
      'auth.googleSignInFailed': 'Google sign in failed',
    };
    return translations[key] || key;
  }),
}));

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  const mockGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;
  const mockI18n = i18n as jest.Mocked<typeof i18n>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GoogleAuthService();
    // Setup i18n mock for each test
    // @ts-ignore
    mockI18n.t.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'auth.userCancelledLogin': 'User cancelled login',
        'auth.loginIsInProgress': 'Login is in progress',
        'auth.googlePlayServicesAreNotAvailable': 'Google Play Services are not available',
        'auth.googleSignInFailed': 'Google sign in failed',
      };
      return translations[key] || key;
    });
  });

  describe('Constructor', () => {
    it('should call configure on instantiation', () => {
      expect(mockGoogleSignin.configure).toHaveBeenCalledTimes(1);
      expect(mockGoogleSignin.configure).toHaveBeenCalledWith({
        webClientId: '531701025722-l31am96d43d4povmpo746lf5t9tm39gv.apps.googleusercontent.com',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        iosClientId: '531701025722-4kn96h41jre9ut0nf65e15t0117l3k20.apps.googleusercontent.com',
        googleServicePlistPath: '',
        openIdRealm: '',
        profileImageSize: 120,
      });
    });
  });

  describe('configure', () => {
    it('should configure GoogleSignin with correct parameters', () => {
      // Reset mock to test configure method directly
      mockGoogleSignin.configure.mockClear();

      service.configure();

      expect(mockGoogleSignin.configure).toHaveBeenCalledWith({
        webClientId: '531701025722-l31am96d43d4povmpo746lf5t9tm39gv.apps.googleusercontent.com',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        iosClientId: '531701025722-4kn96h41jre9ut0nf65e15t0117l3k20.apps.googleusercontent.com',
        googleServicePlistPath: '',
        openIdRealm: '',
        profileImageSize: 120,
      });
    });
  });

  describe('updateConfiguration', () => {
    it('should update webClientId and call configure', () => {
      const newWebClientId = 'new-web-client-id';
      mockGoogleSignin.configure.mockClear();

      service.updateConfiguration({ webClientId: newWebClientId });

      expect(service).toHaveProperty('webClientId', newWebClientId);
      expect(mockGoogleSignin.configure).toHaveBeenCalledTimes(1);
    });

    it('should update iosClientId and call configure', () => {
      const newIosClientId = 'new-ios-client-id';
      mockGoogleSignin.configure.mockClear();

      service.updateConfiguration({ iosClientId: newIosClientId });

      expect(service).toHaveProperty('iosClientId', newIosClientId);
      expect(mockGoogleSignin.configure).toHaveBeenCalledTimes(1);
    });

    it('should update both webClientId and iosClientId', () => {
      const newWebClientId = 'new-web-client-id';
      const newIosClientId = 'new-ios-client-id';
      mockGoogleSignin.configure.mockClear();

      service.updateConfiguration({
        webClientId: newWebClientId,
        iosClientId: newIosClientId,
      });

      expect(service).toHaveProperty('webClientId', newWebClientId);
      expect(service).toHaveProperty('iosClientId', newIosClientId);
      expect(mockGoogleSignin.configure).toHaveBeenCalledTimes(1);
    });
  });

  describe('signIn', () => {
    const mockSignInResult = {
      data: {
        idToken: 'mock-id-token',
        user: {
          id: 'mock-user-id',
          email: 'mock@example.com',
          name: 'Mock User',
          photo: 'mock-photo-url',
          familyName: 'Mock',
          givenName: 'User',
        },
      },
    };

    beforeEach(() => {
      // @ts-ignore
      mockGoogleSignin.hasPlayServices.mockResolvedValue();
      mockGoogleSignin.signIn.mockResolvedValue(mockSignInResult as any);
    });

    it('should successfully sign in and return correct response format', async () => {
      const result = await service.signIn();

      expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalledTimes(1);
      expect(mockGoogleSignin.signIn).toHaveBeenCalledTimes(1);

      const expectedResponse: GoogleSignInResponse = {
        idToken: 'mock-id-token',
        user: {
          id: 'mock-user-id',
          email: 'mock@example.com',
          name: 'Mock User',
          photo: 'mock-photo-url',
          familyName: 'Mock',
          givenName: 'User',
        },
      };

      expect(result).toEqual(expectedResponse);
    });

    it('should throw error when sign in is cancelled', async () => {
      const error = { code: statusCodes.SIGN_IN_CANCELLED };
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(service.signIn()).rejects.toThrow('User cancelled login');
      expect(mockI18n.t).toHaveBeenCalledWith('auth.userCancelledLogin');
    });

    it('should throw error when sign in is in progress', async () => {
      const error = { code: statusCodes.IN_PROGRESS };
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(service.signIn()).rejects.toThrow('Login is in progress');
      expect(mockI18n.t).toHaveBeenCalledWith('auth.loginIsInProgress');
    });

    it('should throw error when play services not available', async () => {
      const error = { code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE };
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(service.signIn()).rejects.toThrow('Google Play Services are not available');
      expect(mockI18n.t).toHaveBeenCalledWith('auth.googlePlayServicesAreNotAvailable');
    });

    it('should throw generic error for other errors', async () => {
      const error = { code: 'UNKNOWN_ERROR' };
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(service.signIn()).rejects.toThrow('Google sign in failed');
      expect(mockI18n.t).toHaveBeenCalledWith('auth.googleSignInFailed');
    });

    it('should throw error when hasPlayServices fails', async () => {
      mockGoogleSignin.hasPlayServices.mockRejectedValue(new Error('Play services error'));

      await expect(service.signIn()).rejects.toThrow('Google sign in failed');
    });
  });

  describe('signOut', () => {
    it('should call GoogleSignin.signOut', async () => {
      // @ts-ignore
      mockGoogleSignin.signOut.mockResolvedValue();

      await service.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.signOut.mockRejectedValue(new Error('Sign out error'));

      await service.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Sign out error'));

      consoleSpy.mockRestore();
    });
  });

  describe('revokeAccess', () => {
    it('should call GoogleSignin.revokeAccess', async () => {
      // @ts-ignore
      mockGoogleSignin.revokeAccess.mockResolvedValue();

      await service.revokeAccess();

      expect(mockGoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.revokeAccess.mockRejectedValue(new Error('Revoke access error'));

      await service.revokeAccess();

      expect(mockGoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Revoke access error'));

      consoleSpy.mockRestore();
    });
  });

  describe('clearCachedAccessToken', () => {
    it('should get tokens and clear cached access token', async () => {
      const mockTokens = { accessToken: 'mock-access-token', idToken: 'mock-id-token' };
      mockGoogleSignin.getTokens.mockResolvedValue(mockTokens);
      // @ts-ignore
      mockGoogleSignin.clearCachedAccessToken.mockResolvedValue();

      await service.clearCachedAccessToken();

      expect(mockGoogleSignin.getTokens).toHaveBeenCalledTimes(1);
      expect(mockGoogleSignin.clearCachedAccessToken).toHaveBeenCalledWith('mock-access-token');
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.getTokens.mockRejectedValue(new Error('Get tokens error'));

      await service.clearCachedAccessToken();

      expect(mockGoogleSignin.getTokens).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Get tokens error'));

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-id', email: 'user@example.com' };
      // @ts-ignore
      mockGoogleSignin.getCurrentUser.mockReturnValue(mockUser);

      const result = await service.getCurrentUser();

      expect(mockGoogleSignin.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user', async () => {
      mockGoogleSignin.getCurrentUser.mockReturnValue(null);

      const result = await service.getCurrentUser();

      expect(mockGoogleSignin.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('isSignedIn', () => {
    it('should return true when user exists', async () => {
      const mockUser = { id: 'user-id', email: 'user@example.com' };
      // @ts-ignore
      mockGoogleSignin.getCurrentUser.mockReturnValue(mockUser);

      const result = await service.isSignedIn();

      expect(result).toBe(true);
      expect(mockGoogleSignin.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should return false when no user', async () => {
      mockGoogleSignin.getCurrentUser.mockReturnValue(null);

      const result = await service.isSignedIn();

      expect(result).toBe(false);
      expect(mockGoogleSignin.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });
});
