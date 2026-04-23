import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './apiEndpoints';
import { getCurrentLanguage } from '@/i18n';

export type RefreshTokenResult = { access_token: string; refresh_token?: string };

export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`;
  const response = await axios.post(
    url,
    { refresh_token: refreshToken },
    {
      timeout: 30000,
      headers: {
        accept: 'application/json',
        'Accept-Language': getCurrentLanguage(),
      },
      withCredentials: false,
    }
  );
  return response.data.data || response.data;
}
