// __tests__/helpers/mockStore.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/redux/slices/authSlice';
import type { AuthState } from '../../src/redux/slices/authSlice';

// Root state type
export interface RootState {
  auth: AuthState;
}

// Create mock store with any type for flexibility
export const createMockStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    } as any,
    preloadedState: preloadedState as any,
  });
};

// Mock states - Đơn giản hơn
export const mockAuthState: Record<string, Partial<RootState>> = {
  authenticated: {
    auth: {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
      isLoading: false,
      error: null,
      isAuthenticated: true,
    },
  },

  unauthenticated: {
    auth: {
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    },
  },

  loading: {
    auth: {
      user: null,
      token: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
    },
  },

  error: {
    auth: {
      user: null,
      token: null,
      isLoading: false,
      error: 'Login failed',
      isAuthenticated: false,
    },
  },
};

export type MockStore = ReturnType<typeof createMockStore>;
