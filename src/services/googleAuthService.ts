import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import i18n from '@/i18n';

export interface GoogleSignInResponse {
  idToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
    familyName?: string;
    givenName?: string;
  };
}

export class GoogleAuthService {
  private webClientId = '83904244147-bi1er9v9p7k7kufbhdcq8c3s629t444t.apps.googleusercontent.com';
  private iosClientId = '83904244147-f764aoer68v5pop2sn9qu0ab25pm8a44.apps.googleusercontent.com';

  constructor() {
    this.configure();
  }

  configure() {
    GoogleSignin.configure({
      webClientId: this.webClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      accountName: '',
      iosClientId: this.iosClientId,
      googleServicePlistPath: '',
      openIdRealm: '',
      profileImageSize: 120,
    });
  }

  updateConfiguration(config: { webClientId?: string; iosClientId?: string }) {
    if (config.webClientId) {
      this.webClientId = config.webClientId;
    }
    if (config.iosClientId) {
      this.iosClientId = config.iosClientId;
    }
    this.configure();
  }

  async signIn(): Promise<GoogleSignInResponse> {
    try {
      await GoogleSignin.hasPlayServices();
      const result = (await GoogleSignin.signIn()) as any;
      return {
        idToken: result.data.idToken,
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          photo: result.data.user.photo,
          familyName: result.data.user.familyName,
          givenName: result.data.user.givenName,
        },
      };
    } catch (error: any) {
      console.log(error, statusCodes);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error(i18n.t('auth.userCancelledLogin'));
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error(i18n.t('auth.loginIsInProgress'));
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error(i18n.t('auth.googlePlayServicesAreNotAvailable'));
      } else {
        throw new Error(i18n.t('auth.googleSignInFailed'));
      }
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error(error);
    }
  }

  async revokeAccess() {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error(error);
    }
  }

  async clearCachedAccessToken() {
    try {
      const tokens = await GoogleSignin.getTokens();
      await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
    } catch (error) {
      console.error(error);
    }
  }

  async getCurrentUser() {
    return GoogleSignin.getCurrentUser();
  }

  async isSignedIn(): Promise<boolean> {
    const user = GoogleSignin.getCurrentUser();
    return !!user;
  }
}

export default new GoogleAuthService();
