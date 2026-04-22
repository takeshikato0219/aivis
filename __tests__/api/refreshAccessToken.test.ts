import axios from 'axios';
import { refreshAccessToken, RefreshTokenResult } from '@/api/refreshAccessToken';
import { API_BASE_URL, API_ENDPOINTS } from '@/api/apiEndpoints';

jest.mock('axios');
jest.mock('@/i18n', () => ({
  __esModule: true,
  getCurrentLanguage: () => 'en',
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRefreshToken = 'mock-refresh-token';
const mockAccessToken = 'mock-access-token';
const mockRefreshTokenResult: RefreshTokenResult = {
  access_token: mockAccessToken,
  refresh_token: 'mock-new-refresh-token',
};

describe('refreshAccessToken', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call axios.post with correct params and return data.data if present', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: mockRefreshTokenResult },
    });
    const result = await refreshAccessToken(mockRefreshToken);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refresh_token: mockRefreshToken },
      expect.objectContaining({
        timeout: 30000,
        headers: expect.objectContaining({
          accept: 'application/json',
          'Accept-Language': 'en',
        }),
        withCredentials: false,
      })
    );
    expect(result).toEqual(mockRefreshTokenResult);
  });

  it('should return data if data.data is not present', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: mockRefreshTokenResult,
    });
    const result = await refreshAccessToken(mockRefreshToken);
    expect(result).toEqual(mockRefreshTokenResult);
  });

  it('should throw if axios.post throws', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
    await expect(refreshAccessToken(mockRefreshToken)).rejects.toThrow('Network error');
  });
});
