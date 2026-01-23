import reducer, {
  clearError,
  setUser,
  logout,
  AuthState,
  loginAsync,
  registerAsync,
  refreshTokenAsync,
} from '@redux/slices/authSlice';
import type { User } from '@api/types/authTypes';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  };

  it('should handle clearError', () => {
    const state = { ...initialState, error: 'Some error' };
    expect(reducer(state, clearError())).toEqual({
      ...state,
      error: null,
    });
  });

  it('should handle setUser', () => {
    const user: User = { id: '1', name: 'Test', email: 'test@example.com' };
    expect(reducer(initialState, setUser(user))).toEqual({
      ...initialState,
      user,
      isAuthenticated: true,
    });
  });

  it('should handle logout', () => {
    const state = {
      ...initialState,
      user: { id: '1', name: 'Test', email: 'test@example.com' },
      token: 'token',
      isAuthenticated: true,
    };
    expect(reducer(state, logout())).toEqual({
      ...initialState,
      user: null,
      token: 'token',
      isAuthenticated: false,
    });
  });

  it('should handle loginAsync.pending', () => {
    const action = { type: loginAsync.pending.type };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loginAsync.fulfilled', () => {
    const payload = {
      user: { id: '1', name: 'Test', email: 'test@example.com' },
      token: 'token',
    };
    const action = { type: loginAsync.fulfilled.type, payload };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(payload.user);
  });

  it('should handle loginAsync.rejected', () => {
    const action = {
      type: loginAsync.rejected.type,
      payload: 'Login failed',
    };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Login failed');
  });

  it('should handle registerAsync.pending', () => {
    const action = { type: registerAsync.pending.type };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle registerAsync.rejected', () => {
    const action = { type: registerAsync.rejected.type, payload: 'Registration failed' };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Registration failed');
  });

  it('should handle refreshTokenAsync.pending', () => {
    const action = { type: refreshTokenAsync.pending.type };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(true);
  });

  it('should handle refreshTokenAsync.fulfilled', () => {
    const payload = { accessToken: 'new-token', refreshToken: 'new-refresh' };
    const action = { type: refreshTokenAsync.fulfilled.type, payload };
    const state = reducer({ ...initialState, accessToken: 'old-token' }, action);
    expect(state.isLoading).toBe(false);
    expect(state.accessToken).toBe('new-token');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.error).toBeNull();
  });

  it('should handle refreshTokenAsync.rejected', () => {
    const action = { type: refreshTokenAsync.rejected.type, payload: 'Token refresh failed' };
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Token refresh failed');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
