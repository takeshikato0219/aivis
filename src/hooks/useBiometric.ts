import { useEffect, useState, useCallback } from 'react';
import {
  checkBiometricAvailability,
  saveBiometricTokens,
  getBiometricTokens,
  isBiometricEnabled,
  disableBiometricLogin,
  getBiometricTypeName,
  getBiometricIconName,
  BiometricInfo,
  BiometricTokens,
} from '@/services/biometricService';

export const useBiometric = () => {
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    available: false,
    biometryType: undefined,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const info = await checkBiometricAvailability();
    setBiometricInfo(info);

    if (info.available) {
      setIsEnabled(await isBiometricEnabled());
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    biometricInfo,
    isEnabled,
    isLoading,
    biometricTypeName: getBiometricTypeName(biometricInfo.biometryType),
    biometricIconName: getBiometricIconName(biometricInfo.biometryType),
    saveCredentials: (tokens: BiometricTokens) =>
      saveBiometricTokens(tokens).then((ok) => {
        if (ok) setIsEnabled(true);
        return ok;
      }),
    getCredentials: getBiometricTokens,
    disable: async () => {
      await disableBiometricLogin();
      setIsEnabled(false);
    },
    refresh,
  };
};
