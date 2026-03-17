import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@redux/store';
import { Alert, AppState } from 'react-native';
import authService from '@/services/authService';
import { setUser, logout } from '@redux/slices/authSlice';
import { setUserData, removeAuthData } from '@utils/authStorage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export const useUserSync = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const syncUserData = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const freshUserData = await authService.getMe();
      // Check email change
      if (freshUserData.email !== user?.email) {
        Alert.alert(
          t('profile.emailChangeDetected'),
          t('profile.emailChangeDetectedMessage'),
          [
            {
              text: t('profile.loginAgain'),
              onPress: async () => {
                await removeAuthData();
                dispatch(logout());
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }

      // Check other changes
      const hasOtherChanges =
        freshUserData.updated_at !== user?.updated_at ||
        freshUserData.name !== user?.name ||
        freshUserData.avatar_url !== user?.avatar_url;
      if (hasOtherChanges) {
        dispatch(setUser(freshUserData));
        await setUserData(freshUserData);
      }
    } catch (error: any) {
      // 401 is already handled by the axios interceptor (refresh + logout on failure)
      if (error?.response?.status === 401 || error?.apiStatusCode === 401) {
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    user?.email,
    user?.updated_at,
    user?.name,
    user?.avatar_url,
    dispatch,
    navigation,
    t,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncUserData();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [syncUserData]);

  useFocusEffect(
    useCallback(() => {
      syncUserData();
      return () => {};
    }, [syncUserData])
  );

  // Initial load
  useEffect(() => {
    syncUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { syncUserData };
};
