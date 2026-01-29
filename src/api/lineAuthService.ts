import Line from '@xmartlabs/react-native-line';
import { Platform } from 'react-native';
import i18n from '@/i18n';

// LINE SDK is now setup in native AppDelegate, no need to setup here

export interface LineLoginResult {
  accessToken: string;
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Global flag to prevent multiple setups
let isLineSdkConfigured = false;

export class LineAuthService {
  private channelId = '2008969814';

  private configure() {
    if (isLineSdkConfigured) {
      return;
    }
    isLineSdkConfigured = true;
  }

  async getCurrentUser() {
    this.configure();
    try {
      const user = await Line.getProfile();
      console.log('[LINE] Current user:', user);
      return user;
    } catch (error) {
      console.log('[LINE] Failed to get current user:', error);
      return null;
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      const token = await Line.getCurrentAccessToken();
      const isSignedIn = !!token?.accessToken;
      return isSignedIn;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  async signOut() {
    this.configure();
    try {
      await Line.logout();
    } catch (error) {
      console.warn('[LINE] Logout failed:', error);
    }
  }

  async signIn(): Promise<LineLoginResult> {
    try {
      this.configure();

      const alreadyLoggedIn = await this.isSignedIn();
      if (alreadyLoggedIn) {
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          return {
            accessToken: '', // Will get from backend
            userId: currentUser.userId,
            displayName: currentUser.displayName,
            pictureUrl: currentUser.pictureUrl,
            statusMessage: currentUser.statusMessage,
          };
        }
      }

      const result = await Line.login({});

      if (!result?.accessToken?.accessToken) {
        throw new Error(i18n.t('auth.lineAccessTokenNotFound'));
      }

      if (!result?.userProfile) {
        throw new Error(i18n.t('auth.lineUserProfileNotFound'));
      }

      return {
        accessToken: result.accessToken.accessToken,
        userId: result.userProfile.userId,
        displayName: result.userProfile.displayName,
        pictureUrl: result.userProfile.pictureUrl,
        statusMessage: result.userProfile.statusMessage,
      };
    } catch (error: any) {
      console.error('[LINE] login error:', error);

      const platform = Platform.OS;

      switch (error?.code) {
        case 'CANCEL':
          throw new Error(i18n.t('auth.userCancelledLineLogin'));
        case 'AUTHENTICATION_AGENT_ERROR':
          // Platform-specific guidance for app installation
          const installMessage =
            platform === 'ios' ? i18n.t('auth.lineInstallIOS') : i18n.t('auth.lineInstallAndroid');
          throw new Error(i18n.t('auth.lineAppNotInstalled') + '\n\n' + installMessage);
        case 'NETWORK_ERROR':
          throw new Error(i18n.t('auth.lineNetworkError'));
        default:
          // Platform-specific error handling
          if (platform === 'ios') {
            // iOS specific errors
            if (error?.message?.includes('scheme') || error?.message?.includes('url')) {
              throw new Error(i18n.t('auth.lineIOSSchemeError'));
            }
          } else if (platform === 'android') {
            // Android specific errors
            if (error?.message?.includes('intent') || error?.message?.includes('activity')) {
              throw new Error(i18n.t('auth.lineAndroidIntentError'));
            }
          }

          // Generic error handling
          if (error?.message?.includes('network') || error?.message?.includes('connection')) {
            throw new Error(i18n.t('auth.lineNetworkError'));
          } else if (error?.message?.includes('cancel') || error?.message?.includes('abort')) {
            throw new Error(i18n.t('auth.userCancelledLineLogin'));
          } else {
            throw new Error(error?.message || i18n.t('auth.lineSignInFailed'));
          }
      }
    }
  }
}

export default new LineAuthService();
