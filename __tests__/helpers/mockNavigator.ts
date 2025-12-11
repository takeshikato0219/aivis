import { StackNavigationProp } from '@react-navigation/stack';

// Mock navigation object
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
} as unknown as StackNavigationProp<any>;

// Mock route object
export const mockRoute = {
  key: 'test-route-key',
  name: 'TestScreen',
  params: {},
  path: undefined,
};

// Create custom navigation mock
export const createMockNavigation = (overrides = {}) => ({
  ...mockNavigation,
  ...overrides,
});

// Create custom route mock
export const createMockRoute = (name: string, params = {}) => ({
  ...mockRoute,
  name,
  params,
});
