import reducer, {
  clearError,
  setUser,
  logout,
  AuthState,
  loginAsync,
} from '@redux/slices/authSlice';
import { User } from '@api/authService';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
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
      ...state,
      user: null,
      token: null,
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
    expect(state.token).toBe(payload.token);
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
});
