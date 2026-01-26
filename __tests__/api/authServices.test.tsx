// __tests__/api/authService.test.ts
import AuthService from '../../src/api/authService';
import { LoginRequest } from '@api/types/authTypes';
import axiosInstance from '../../src/api/axiosConfig';
import { API_ENDPOINTS } from '@api/apiEndpoints';

jest.mock('../../src/api/axiosConfig');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login calls axios with correct params and returns data', async () => {
    const mockApiResponse = {
      data: {
        data: {
          access_token: 'abc123',
          refresh_token: 'refresh123',
          user_info: {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            phone: '1234567890',
            line_user_id: null,
            is_admin: false,
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            deleted_at: null,
            avatar_path: null,
            avatar_url: null,
            status: 'active',
            type: 'user',
          },
        },
      },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue(mockApiResponse);

    const req: LoginRequest = { email: 'test@example.com', password: 'pass' };
    const res = await AuthService.login(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, req);
    expect(res).toEqual({
      accessToken: 'abc123',
      refreshToken: 'refresh123',
      user: {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        line_user_id: null,
        is_admin: false,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        deleted_at: null,
        avatar_path: null,
        avatar_url: null,
        status: 'active',
        type: 'user',
      },
    });
  });

  it('logout calls axios with correct endpoint', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({});
    await AuthService.logout();
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
  });

  it('register calls axios with correct params and returns data', async () => {
    const mockApiResponse = {
      data: {
        data: {
          access_token: 'abc123',
          refresh_token: 'refresh123',
          user_info: {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            phone: '1234567890',
            line_user_id: null,
            is_admin: false,
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            deleted_at: null,
            avatar_path: null,
            avatar_url: null,
            status: 'active',
            type: 'user',
          },
        },
      },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue(mockApiResponse);

    const req = {
      email: 'test@example.com',
      password: 'pass',
      confirm_password: 'pass',
      name: 'Test',
      phone: '1234567890',
    };
    const res = await AuthService.register(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH.REGISTER,
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(res).toEqual({
      accessToken: 'abc123',
      refreshToken: 'refresh123',
      user: {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        line_user_id: null,
        is_admin: false,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        deleted_at: null,
        avatar_path: null,
        avatar_url: null,
        status: 'active',
        type: 'user',
      },
    });
  });

  it('forgotPassword calls axios with correct params', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({});
    await AuthService.forgotPassword('test@example.com');
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email: 'test@example.com',
    });
  });

  it('getMe calls axios with correct endpoint', async () => {
    const mockUserData = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      line_user_id: null,
      is_admin: false,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      deleted_at: null,
      avatar_path: null,
      avatar_url: null,
      status: 'active',
      type: 'user',
    };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: { data: mockUserData } });

    const result = await AuthService.getMe();
    expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.ME, {});
    expect(result).toEqual(mockUserData);
  });

  it('getMe calls axios with token when provided', async () => {
    const mockUserData = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      line_user_id: null,
      is_admin: false,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      deleted_at: null,
      avatar_path: null,
      avatar_url: null,
      status: 'active',
      type: 'user',
    };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: { data: mockUserData } });

    const result = await AuthService.getMe('test-token');
    expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.ME, {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(result).toEqual(mockUserData);
  });

  it('refreshToken calls axios with correct params', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue({ data: { data: mockResponse } });

    const result = await AuthService.refreshToken('old-refresh-token');
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refresh_token: 'old-refresh-token',
    });
    expect(result).toEqual(mockResponse);
  });

  it('updateProfile calls axios with correct params', async () => {
    const mockUserData = {
      id: '1',
      name: 'Updated User',
      email: 'updated@example.com',
      phone: '0987654321',
      line_user_id: null,
      is_admin: false,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      deleted_at: null,
      avatar_path: null,
      avatar_url: null,
      status: 'active',
      type: 'user',
    };
    (axiosInstance.patch as jest.Mock).mockResolvedValue({ data: { data: mockUserData } });

    const updateData = {
      name: 'Updated User',
      email: 'updated@example.com',
      phone: '0987654321',
    };
    const result = await AuthService.updateProfile(updateData);

    expect(axiosInstance.patch).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.ME, expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(result).toEqual(mockUserData);
  });

  it('register handles avatar upload', async () => {
    const mockApiResponse = {
      data: {
        data: {
          access_token: 'abc123',
          refresh_token: 'refresh123',
          user_info: {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            phone: '1234567890',
            line_user_id: null,
            is_admin: false,
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            deleted_at: null,
            avatar_path: null,
            avatar_url: null,
            status: 'active',
            type: 'user',
          },
        },
      },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue(mockApiResponse);

    const req = {
      email: 'test@example.com',
      password: 'pass',
      confirm_password: 'pass',
      name: 'Test',
      phone: '1234567890',
      avatar: {
        uri: 'file://avatar.jpg',
        type: 'image/jpeg',
        fileName: 'avatar.jpg',
      },
    };
    await AuthService.register(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH.REGISTER,
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  });

  it('getMe handles nested response structure', async () => {
    const mockUserData = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      line_user_id: null,
      is_admin: false,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      deleted_at: null,
      avatar_path: null,
      avatar_url: null,
      status: 'active',
      type: 'user',
    };

    // Test response.data structure
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockUserData });

    const result = await AuthService.getMe();
    expect(result).toEqual(mockUserData);
  });

  it('register handles line_user_id', async () => {
    const mockApiResponse = {
      data: {
        data: {
          access_token: 'abc123',
          refresh_token: 'refresh123',
          user_info: {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            phone: '1234567890',
            line_user_id: 'line123',
            is_admin: false,
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            deleted_at: null,
            avatar_path: null,
            avatar_url: null,
            status: 'active',
            type: 'user',
          },
        },
      },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue(mockApiResponse);

    const req = {
      email: 'test@example.com',
      password: 'pass',
      confirm_password: 'pass',
      name: 'Test',
      phone: '1234567890',
      line_user_id: 'line123',
    };
    await AuthService.register(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH.REGISTER,
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  });

  it('updateProfile handles partial updates', async () => {
    const mockUserData = {
      id: '1',
      name: 'Updated Name',
      email: 'test@example.com', // unchanged
      phone: '0987654321',
      line_user_id: null,
      is_admin: false,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      deleted_at: null,
      avatar_path: null,
      avatar_url: null,
      status: 'active',
      type: 'user',
    };
    (axiosInstance.patch as jest.Mock).mockResolvedValue({ data: { data: mockUserData } });

    const updateData = {
      name: 'Updated Name',
      phone: '0987654321',
      // email not included, should not be sent
    };
    const result = await AuthService.updateProfile(updateData);

    expect(result).toEqual(mockUserData);
  });
});
