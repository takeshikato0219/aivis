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

export type MockStore = ReturnType<typeof createMockStore>;
