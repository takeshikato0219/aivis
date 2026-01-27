import Line from '@xmartlabs/react-native-line';

export interface LineLoginResult {
  accessToken: string;
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export const loginWithLine = async (): Promise<LineLoginResult> => {
  try {
    console.log('[LINE] start login');

    const result = await Line.login({});

    if (!result?.accessToken?.accessToken) {
      throw new Error('Không lấy được access token từ LINE');
    }

    if (!result?.userProfile) {
      throw new Error('Không lấy được thông tin người dùng LINE');
    }

    return {
      accessToken: result.accessToken.accessToken,
      userId: result.userProfile.userId,
      displayName: result.userProfile.displayName,
      pictureUrl: result.userProfile.pictureUrl,
      statusMessage: result.userProfile.statusMessage,
    };
  } catch (e: any) {
    console.error('[LINE] login error', e);

    switch (e?.code) {
      case 'CANCEL':
        throw new Error('Bạn đã huỷ đăng nhập LINE');
      case 'AUTHENTICATION_AGENT_ERROR':
        throw new Error('Vui lòng cài đặt ứng dụng LINE');
      case 'NETWORK_ERROR':
        throw new Error('Lỗi mạng, vui lòng thử lại');
      default:
        throw new Error(e?.message || 'Đăng nhập LINE thất bại');
    }
  }
};

export const logoutLine = async () => {
  try {
    await Line.logout();
  } catch (e) {
    console.warn('[LINE] logout failed', e);
  }
};
