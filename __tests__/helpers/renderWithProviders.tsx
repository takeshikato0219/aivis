import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/redux/slices/authSlice';

// Create test store
export const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      // Add other reducers...
    } as any,
    preloadedState,
  });
};

// Wrapper with all providers
interface WrapperProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
}

const AllTheProviders = ({ children, store }: WrapperProps) => {
  const testStore = store || createTestStore();

  return (
    <Provider store={testStore}>
      <NavigationContainer>{children}</NavigationContainer>
    </Provider>
  );
};

// Custom render
export const renderWithProviders = (
  ui: ReactElement,
  {
    store,
    ...renderOptions
  }: { store?: ReturnType<typeof createTestStore> } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return {
    store: store || createTestStore(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Re-export everything from testing library
export * from '@testing-library/react-native';
