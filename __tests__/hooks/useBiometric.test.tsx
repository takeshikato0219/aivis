import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBiometric } from '@hooks/useBiometric';
import * as biometricService from '@/services/biometricService';

jest.mock('@/services/biometricService');

type SetupOverrides = {
  available?: boolean;
  biometryType?: string;
  isEnabled?: boolean;
  saveBiometricTokensResult?: any;
  disableBiometricLoginResult?: any;
};

const defaultInfo = {
  available: true,
  biometryType: 'FaceID',
};

function setupBiometricMocks(overrides: SetupOverrides = {}) {
  const info = {
    available: overrides.available ?? defaultInfo.available,
    biometryType: overrides.biometryType ?? defaultInfo.biometryType,
  };

  (biometricService.checkBiometricAvailability as jest.Mock).mockResolvedValue(info);
  (biometricService.getBiometricTypeName as jest.Mock).mockReturnValue('Face ID');
  (biometricService.getBiometricIconName as jest.Mock).mockReturnValue('face-id-icon');

  if (overrides.isEnabled !== undefined) {
    (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(overrides.isEnabled);
  }

  if (overrides.saveBiometricTokensResult !== undefined) {
    (biometricService.saveBiometricTokens as jest.Mock).mockResolvedValue(
      overrides.saveBiometricTokensResult
    );
  }

  if (overrides.disableBiometricLoginResult !== undefined) {
    (biometricService.disableBiometricLogin as jest.Mock).mockResolvedValue(
      overrides.disableBiometricLoginResult
    );
  }
}

describe('useBiometric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values and refresh biometric info', async () => {
    setupBiometricMocks({ isEnabled: true });

    const { result } = renderHook(() => useBiometric());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biometricInfo).toEqual(defaultInfo);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.biometricTypeName).toBe('Face ID');
    expect(result.current.biometricIconName).toBe('face-id-icon');
  });

  it('should enable biometric after saving credentials', async () => {
    setupBiometricMocks({ isEnabled: false, saveBiometricTokensResult: true });

    const { result } = renderHook(() => useBiometric());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const ok = await result.current.saveCredentials({ accessToken: 'a', refreshToken: 'b' });
      expect(ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });
  });

  it('should disable biometric login', async () => {
    setupBiometricMocks({ isEnabled: true, disableBiometricLoginResult: undefined });

    const { result } = renderHook(() => useBiometric());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.disable();
    });

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false);
    });

    expect(biometricService.disableBiometricLogin).toHaveBeenCalled();
  });

  it('should handle biometric not available', async () => {
    setupBiometricMocks({ available: false, isEnabled: false });

    const { result } = renderHook(() => useBiometric());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biometricInfo.available).toBe(false);
    expect(result.current.isEnabled).toBe(false);
    expect(biometricService.isBiometricEnabled).not.toHaveBeenCalled();
  });
});
