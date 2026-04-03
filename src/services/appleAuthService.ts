import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import i18n from '@/i18n';

export interface AppleSignInResponse {
  idToken: string;
}

class AppleAuthService {
  async signIn(): Promise<AppleSignInResponse> {
    console.log(1, appleAuth);
    if (Platform.OS !== 'ios') {
      throw new Error(i18n.t('auth.appleSignInNotAvailable'));
    }

    if (!appleAuth.isSupported) {
      throw new Error(i18n.t('auth.appleSignInNotAvailable'));
    }

    try {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!response.identityToken) {
        throw new Error(i18n.t('auth.appleSignInFailed'));
      }

      return { idToken: response.identityToken };
    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED) {
        throw new Error(i18n.t('auth.userCancelledLogin'));
      }
      throw new Error(error?.message || i18n.t('auth.appleSignInFailed'));
    }
  }
}

export default new AppleAuthService();
