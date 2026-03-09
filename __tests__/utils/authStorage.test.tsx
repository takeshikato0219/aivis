import * as authStorage from '../../src/utils/authStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('AuthStorage', () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setUserData', () => {
    it('should store user data', async () => {
      const userData = { id: '1', email: 'test@example.com', name: 'Test', phone: '1234567890' };

      await authStorage.setUserData(userData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
    });
  });

  describe('setAuthData', () => {
    it('should store auth data', async () => {
      const accessToken = 'token123';
      const refreshToken = 'refresh456';
      const user = { id: '1', email: 'test@example.com', name: 'Test', phone: '1234567890' };

      await authStorage.setAuthData(accessToken, refreshToken, user);

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
    });
  });

  describe('getAuthData', () => {
    it('should retrieve auth data', async () => {
      const expectedData = {
        accessToken: 'token123',
        refreshToken: 'refresh456',
        user: { id: '1', name: 'Test User' },
      };

      AsyncStorage.multiGet.mockResolvedValue([
        ['accessToken', 'token123'],
        ['refreshToken', 'refresh456'],
        ['user', JSON.stringify(expectedData.user)],
      ]);

      const result = await authStorage.getAuthData();

      expect(AsyncStorage.multiGet).toHaveBeenCalledWith(['accessToken', 'refreshToken', 'user']);
      expect(result).toEqual(expectedData);
    });

    it('should return null values when no data', async () => {
      AsyncStorage.multiGet.mockResolvedValue([
        ['accessToken', null],
        ['refreshToken', null],
        ['user', null],
      ]);

      const result = await authStorage.getAuthData();

      expect(result).toEqual({ accessToken: null, refreshToken: null, user: null });
    });
  });

  describe('removeAuthData', () => {
    it('should remove auth data', async () => {
      await authStorage.removeAuthData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'accessToken',
        'refreshToken',
        'user',
        'lineProfile',
      ]);
    });
  });
});
