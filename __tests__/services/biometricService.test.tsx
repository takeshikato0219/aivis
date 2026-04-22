import type { BiometricTokens } from '../../src/services/biometricService';

// Mock native modules before importing the service
jest.mock('react-native-biometrics', () => {
  // create a mock function that returns an object with isSensorAvailable
  const mockFn = jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(),
  })) as unknown as jest.Mock & { isSensorAvailable?: jest.Mock };

  // also expose a static isSensorAvailable so both call patterns work
  mockFn.isSensorAvailable = jest.fn();

  return {
    __esModule: true,
    default: mockFn,
    // provide a named export too for extra compatibility
    ReactNativeBiometrics: mockFn,
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  ACCESS_CONTROL: { BIOMETRY_ANY: 'BIOMETRY_ANY', BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET' },
  SECURITY_LEVEL: { SECURE_HARDWARE: 'SECURE_HARDWARE' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@assets/svg/face-id.svg', () => 'MOCK_FACE_ID_ICON');

import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as svc from '../../src/services/biometricService';

describe('biometricService', () => {
  const rnBiometricsMock = ReactNativeBiometrics as unknown as jest.Mock;
  const isSensorAvailableMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // ensure constructor returns object with isSensorAvailable
    rnBiometricsMock.mockImplementation(() => ({ isSensorAvailable: isSensorAvailableMock }));
    // also provide a static method in case the service calls ReactNativeBiometrics.isSensorAvailable()
    (ReactNativeBiometrics as any).isSensorAvailable = isSensorAvailableMock;
    Platform.OS = 'ios';
  });

  describe('saveBiometricTokens', () => {
    const tokens: BiometricTokens = { accessToken: 'a', refreshToken: 'b' };

    it('saves tokens and marks enabled on success', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const ok = await svc.saveBiometricTokens(tokens);
      expect(ok).toBe(true);
      expect(Keychain.setGenericPassword).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@biometric_enabled', 'true');
    });

    it('returns false and logs on failure', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('kc fail'));

      const ok = await svc.saveBiometricTokens(tokens);
      expect(ok).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('getBiometricTokens', () => {
    it('returns parsed tokens when credentials present', async () => {
      const stored = JSON.stringify({ accessToken: 'x', refreshToken: 'y' });
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({ password: stored });

      const got = await svc.getBiometricTokens();
      expect(got).toEqual({ accessToken: 'x', refreshToken: 'y' });
    });

    it('returns null when no credentials', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(null);
      const got = await svc.getBiometricTokens();
      expect(got).toBeNull();
    });

    it('returns null and logs on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('err'));
      const got = await svc.getBiometricTokens();
      expect(got).toBeNull();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('isBiometricEnabled / disableBiometricLogin', () => {
    it('reads enabled flag', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      const enabled = await svc.isBiometricEnabled();
      expect(enabled).toBe(true);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
      const disabled = await svc.isBiometricEnabled();
      expect(disabled).toBe(false);
    });

    it('resets keychain and removes flag on disable', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await svc.disableBiometricLogin();
      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.aivis.camera.ai.biometric',
      });
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@biometric_enabled');
    });
  });

  describe('helpers: getBiometricTypeName / getBiometricIconName', () => {
    it('maps biometry types to friendly names', () => {
      Platform.OS = 'ios';
      expect(svc.getBiometricTypeName('FaceID')).toBe('Face ID');
      expect(svc.getBiometricTypeName('TouchID')).toBe('Touch ID');

      Platform.OS = 'android';
      expect(svc.getBiometricTypeName('Biometrics')).toBe('Fingerprint');

      Platform.OS = 'ios';
      expect(svc.getBiometricTypeName('Biometrics')).toBe('Biometrics');

      expect(svc.getBiometricTypeName(undefined)).toBe('Biometric Authentication');
    });

    it('returns correct icon/name values', () => {
      expect(svc.getBiometricIconName('FaceID')).toBe('MOCK_FACE_ID_ICON');
      expect(svc.getBiometricIconName('TouchID')).toBe('fingerprint');
      expect(svc.getBiometricIconName(undefined)).toBe('shield-lock');
    });
  });
});
