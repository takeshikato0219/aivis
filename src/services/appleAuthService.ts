import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import i18n from '@/i18n';

export interface AppleSignInResponse {
  idToken: string;
  givenName?: string | null;
  familyName?: string | null;
}

class AppleAuthService {
  async signIn(): Promise<AppleSignInResponse> {
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

      return {
        idToken: response.identityToken,
        givenName: response.fullName?.givenName ?? null,
        familyName: response.fullName?.familyName ?? null,
      };
    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED) {
        throw new Error(i18n.t('auth.userCancelledLogin'));
      }
      throw new Error(error?.message || i18n.t('auth.appleSignInFailed'));
    }
  }
}

export default new AppleAuthService();
