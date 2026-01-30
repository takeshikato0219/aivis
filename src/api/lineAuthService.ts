import Line from "@xmartlabs/react-native-line";
import { Linking } from "react-native";
import { showCommonAlert } from "@components/Alert/Alert";

export interface LineLoginResult {
  accessToken: string;
  idToken?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

let isLineSdkConfigured = false;

export class LineAuthService {
  private channelId = '2008969814';

  private async isLineAppInstalled(): Promise<boolean> {
    try {
      const lineUrl = 'line://';
      return await Linking.canOpenURL(lineUrl);
    } catch (error) {
      console.log('[LINE] Error checking LINE app installation:', error);
      return false;
    }
  }

  private async configure() {
    if (isLineSdkConfigured) {
      return;
    }

    try {
      const setupParams = { channelId: this.channelId };
      await Line.setup(setupParams);
      isLineSdkConfigured = true;
    } catch (error: any) {
      console.log('[LINE] Setup error caught:', error);
    }
  }

  async getCurrentUser() {
    await this.configure();
    try {
      return await Line.getProfile();
    } catch (error) {
      console.log('[LINE] Failed to get current user:', error);
      return null;
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await this.configure();
      const token = await Line.getCurrentAccessToken();
      return !!token?.accessToken;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  async signOut() {
    try {
      await this.configure();
      await Line.logout();
    } catch (error: any) {
      showCommonAlert({
        title: 'Error',
        message: error.message,
        buttons: [{ text: 'OK' }],
      });
    }
  }

  async signIn(): Promise<LineLoginResult | undefined> {
    try {
      const isLineInstalled = await this.isLineAppInstalled();
      try {
        await this.configure();
      } catch (error: any) {
        showCommonAlert({
          title: 'Error',
          message: error.message,
          buttons: [{ text: 'OK' }],
        });
      }

      const loginOptions = {
        scopes: ['profile', 'openid', 'email'] as any,
        onlyWebLogin: !isLineInstalled,
      };

      const result = await Line.login(loginOptions);
      return {
        accessToken: result.accessToken.accessToken,
        idToken: result.accessToken.idToken,
      };
    } catch (error: any) {
      showCommonAlert({
        title: 'Error',
        message: error.message,
        buttons: [{ text: 'OK' }],
      });
      return undefined;
    }
  }
}

export default new LineAuthService();
