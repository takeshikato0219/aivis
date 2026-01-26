import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

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
  private webClientId = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
  private iosClientId = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

  constructor() {
    this.configure();
  }

  configure() {
    if (!this.webClientId || this.webClientId === 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com') {
      console.warn('Google Sign-In chưa được cấu hình đúng. Vui lòng cập nhật webClientId');
    }

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
        idToken: result.idToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          photo: result.user.photo,
          familyName: result.user.familyName,
          givenName: result.user.givenName,
        },
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Người dùng đã hủy đăng nhập');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Đăng nhập đang được xử lý');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services không khả dụng');
      } else {
        throw new Error('Đăng nhập Google thất bại');
      }
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Lỗi khi đăng xuất Google:', error);
    }
  }

  async revokeAccess() {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Lỗi khi revoke access:', error);
    }
  }

  async clearCachedAccessToken() {
    try {
      const tokens = await GoogleSignin.getTokens();
      await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
    } catch (error) {
      console.error('Lỗi khi clear cached token:', error);
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
