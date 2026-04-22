import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import FaceIdIcon from '@assets/svg/face-id.svg';
import type { SvgProps } from 'react-native-svg';
import type { FC } from 'react';

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: false,
});

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const KEYCHAIN_SERVICE = 'com.aivis.camera.ai.biometric';

type BiometryType = 'FaceID' | 'TouchID' | 'Biometrics' | undefined;

export interface BiometricInfo {
  available: boolean;
  biometryType: BiometryType;
  error?: string;
}

export interface BiometricTokens {
  accessToken: string;
  refreshToken?: string;
}

// CHECK BIOMETRIC AVAILABILITY
export const checkBiometricAvailability = async (): Promise<BiometricInfo> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType: biometryType as BiometryType };
  } catch (error) {
    return {
      available: false,
      biometryType: undefined,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// SAVE CREDENTIALS (only accessToken, refreshToken)
export const saveBiometricTokens = async (tokens: BiometricTokens): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword(
      'biometric',
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
      {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        accessControl: Platform.select({
          ios: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          android: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }),
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      }
    );
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('[BIOMETRIC] Save token failed', error);
    return false;
  }
};

// GET CREDENTIALS (prompt biometric, only token)
export const getBiometricTokens = async (): Promise<BiometricTokens | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
      authenticationPrompt: {
        title: 'Authentication Required',
        subtitle: 'Use biometrics to login',
        cancel: 'Cancel',
      },
    });

    if (!credentials) return null;

    return JSON.parse(credentials.password);
  } catch (error: any) {
    console.error('[BIOMETRIC] Get token failed', error);
    if (
      error.message?.includes('Decryption failed') ||
      error.message?.includes('Authentication tag verification failed')
    ) {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    }

    return null;
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return enabled === 'true';
};

export const disableBiometricLogin = async (): Promise<void> => {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
};

export const getBiometricTypeName = (biometryType: BiometryType): string => {
  switch (biometryType) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Biometrics':
      return Platform.OS === 'android' ? 'Fingerprint' : 'Biometrics';
    default:
      return 'Biometric Authentication';
  }
};

export const getBiometricIconName = (biometryType: BiometryType): string | FC<SvgProps> => {
  switch (biometryType) {
    case 'FaceID':
      return FaceIdIcon;
    case 'TouchID':
    case 'Biometrics':
      return 'fingerprint';
    default:
      return 'shield-lock';
  }
};
