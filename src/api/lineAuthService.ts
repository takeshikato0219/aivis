import Line from '@xmartlabs/react-native-line';
import { showCommonAlert } from '@components/Alert/Alert';
import { BaseLineService } from './baseLineService';

export interface LineLoginResult {
  accessToken: string;
  idToken?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export class LineAuthService extends BaseLineService {
  async signOut() {
    try {
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
      const loginOptions = {
        scopes: ['profile', 'openid', 'email'] as any,
        onlyWebLogin: !isLineInstalled,
        botPrompt: 'normal' as any,
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
