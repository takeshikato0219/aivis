import { LineAuthService } from '@/services/lineAuthService';
import { showCommonAlert } from '@components/Alert/Alert';

jest.mock('@xmartlabs/react-native-line', () => ({
  setup: jest.fn().mockResolvedValue(undefined),
  login: jest.fn(),
  logout: jest.fn(),
}));

const Line = require('@xmartlabs/react-native-line') as {
  setup: jest.Mock;
  login: jest.Mock;
  logout: jest.Mock;
};

const mockCanOpenURL = jest.fn();
jest.mock('react-native', () => ({
  Linking: { canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args) },
  Platform: { OS: 'ios' },
}));

jest.mock('@components/Alert/Alert', () => ({
  showCommonAlert: jest.fn(),
}));

describe('LineAuthService', () => {
  let service: LineAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    Line.setup.mockResolvedValue(undefined);
    service = new LineAuthService();
  });

  describe('signIn', () => {
    it('calls Line.login with onlyWebLogin false when LINE app is installed', async () => {
      mockCanOpenURL.mockResolvedValue(true);
      Line.login.mockResolvedValue({
        accessToken: { accessToken: 'access-token', idToken: 'id-token' },
      });

      await service.signIn();

      expect(mockCanOpenURL).toHaveBeenCalledWith('line://');
      expect(Line.login).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: ['profile', 'openid', 'email'],
          onlyWebLogin: false,
          botPrompt: 'normal',
        })
      );
    });

    it('calls Line.login with onlyWebLogin true when LINE app is not installed', async () => {
      mockCanOpenURL.mockResolvedValue(false);
      Line.login.mockResolvedValue({
        accessToken: { accessToken: 'access-token', idToken: 'id-token' },
      });

      await service.signIn();

      expect(Line.login).toHaveBeenCalledWith(
        expect.objectContaining({
          onlyWebLogin: true,
        })
      );
    });

    it('returns accessToken and idToken on success', async () => {
      mockCanOpenURL.mockResolvedValue(true);
      Line.login.mockResolvedValue({
        accessToken: { accessToken: 'at-1', idToken: 'id-1' },
      });

      const result = await service.signIn();

      expect(result).toEqual({
        accessToken: 'at-1',
        idToken: 'id-1',
      });
    });

    it('shows alert and returns undefined when login fails', async () => {
      mockCanOpenURL.mockResolvedValue(true);
      Line.login.mockRejectedValue(new Error('login failed'));

      const result = await service.signIn();

      expect(result).toBeUndefined();
      expect(showCommonAlert).toHaveBeenCalledWith({
        title: 'Error',
        message: 'login failed',
        buttons: [{ text: 'OK' }],
      });
    });

    it('returns cancelled without alert when user dismisses LINE login (Android CANCEL)', async () => {
      mockCanOpenURL.mockResolvedValue(true);
      const err = Object.assign(new Error('cancelled'), { code: 'CANCEL' });
      Line.login.mockRejectedValue(err);

      const result = await service.signIn();

      expect(result).toBe('cancelled');
      expect(showCommonAlert).not.toHaveBeenCalled();
    });

    it('returns cancelled without alert when user dismisses LINE login (iOS 3003)', async () => {
      mockCanOpenURL.mockResolvedValue(true);
      const err = Object.assign(new Error('User cancelled'), { code: '3003' });
      Line.login.mockRejectedValue(err);

      const result = await service.signIn();

      expect(result).toBe('cancelled');
      expect(showCommonAlert).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('calls Line.logout', async () => {
      Line.logout.mockResolvedValue(undefined);

      await service.signOut();

      expect(Line.logout).toHaveBeenCalled();
    });

    it('shows alert when logout throws', async () => {
      Line.logout.mockRejectedValue(new Error('logout failed'));

      await service.signOut();

      expect(showCommonAlert).toHaveBeenCalledWith({
        title: 'Error',
        message: 'logout failed',
        buttons: [{ text: 'OK' }],
      });
    });
  });
});
