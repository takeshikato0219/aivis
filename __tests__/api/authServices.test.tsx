// __tests__/api/authService.test.ts
import AuthService, { LoginRequest, LoginResponse, User } from '../../src/api/authService';
import axiosInstance from '../../src/api/axiosConfig';
import { API_ENDPOINTS } from '../../src/api/apiEndpoints';

jest.mock('../../src/api/axiosConfig');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login calls axios with correct params and returns data', async () => {
    const mockData: LoginResponse = {
      token: 'abc123',
      user: { id: '1', email: 'test@example.com', name: 'Test' },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockData });

    const req: LoginRequest = { email: 'test@example.com', password: 'pass' };
    const res = await AuthService.login(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, req);
    expect(res).toEqual(mockData);
  });

  it('logout calls axios with correct endpoint', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({});
    await AuthService.logout();
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
  });

  it('getProfile returns user data', async () => {
    const mockUser: User = { id: '1', email: 'test@example.com', name: 'Test' };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockUser });

    const res = await AuthService.getProfile();
    expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.GET_PROFILE);
    expect(res).toEqual(mockUser);
  });

  it('register calls axios with correct params and returns data', async () => {
    const mockData: LoginResponse = {
      token: 'abc123',
      user: { id: '1', email: 'test@example.com', name: 'Test' },
    };
    (axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockData });

    const req = { email: 'test@example.com', password: 'pass', name: 'Test' };
    const res = await AuthService.register(req);

    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REGISTER, req);
    expect(res).toEqual(mockData);
  });

  it('forgotPassword calls axios with correct params', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({});
    await AuthService.forgotPassword('test@example.com');
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email: 'test@example.com',
    });
  });

  it('resetPassword calls axios with correct params', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({});
    await AuthService.resetPassword('token123', 'newpass');
    expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token: 'token123',
      password: 'newpass',
    });
  });
});
