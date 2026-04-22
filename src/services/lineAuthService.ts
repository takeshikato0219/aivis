import Line from '@xmartlabs/react-native-line';
import { Platform } from 'react-native';
import { showCommonAlert } from '@components/Alert/Alert';
import { BaseLineService } from '@/services/baseLineService';

export interface LineLoginResult {
  accessToken: string;
  idToken?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * User closed LINE or dismissed login before completion (Android: CANCEL / activity result 0;
 * iOS: LineSDK authorizeFailed.userCancelled → error code 3003).
 */
export function isLineLoginUserCancelledError(error: unknown): boolean {
  const e = error as { code?: string | number; message?: string };
  const code = e?.code != null ? String(e.code) : '';
  if (code === 'CANCEL' || code === '3003') {
    return true;
  }
  if (Platform?.OS === 'android' && code === '0') {
    return true;
  }
  const msg = (e?.message ?? '').toLowerCase();
  return msg.includes('user cancelled') || msg.includes('user canceled');
}

export type LineSignInResult = LineLoginResult | 'cancelled' | undefined;

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

  async signIn(): Promise<LineSignInResult> {
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
      if (isLineLoginUserCancelledError(error)) {
        return 'cancelled';
      }
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
