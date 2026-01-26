import { Linking } from 'react-native';

export interface LineSignInResponse {
  accessToken: string;
  user: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  };
}

class LineAuthService {
  private channelId = 'YOUR_LINE_CHANNEL_ID'; // Từ LINE Developers Console
  private callbackUrl = 'yourapp://line-login'; // Deep link URL scheme của app

  constructor() {
    // Không cần configure cho LINE Login v2.1
  }

  async signIn(): Promise<LineSignInResponse> {
    try {
      // Tạo LINE Login URL
      const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${this.channelId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&state=random_state_string&scope=profile%20openid%20email`;

      // Mở LINE app hoặc browser
      const supported = await Linking.canOpenURL(loginUrl);
      if (!supported) {
        throw new Error('Không thể mở LINE');
      }

      await Linking.openURL(loginUrl);

      // Trong thực tế, bạn cần xử lý deep link callback
      // Đây chỉ là placeholder - bạn cần implement deep link handling
      throw new Error('LINE login cần implement deep link handling. Tạm thời chưa hỗ trợ.');
    } catch (error: any) {
      console.log(error);
      throw new Error('Đăng nhập LINE thất bại');
    }
  }

  async signOut() {
    // LINE không có concept sign out rõ ràng cho mobile apps
    console.log('LINE sign out - không cần implement');
  }
}

export default new LineAuthService();
