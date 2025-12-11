/* eslint-env jest */

// ============================================
// MOCK REACT NATIVE MODULES
// ============================================

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
}));

// DeviceInfo
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => Promise.resolve('iPhone 13')),
  getSystemVersion: jest.fn(() => Promise.resolve('15.0')),
  getUniqueId: jest.fn(() => Promise.resolve('unique-id')),
}));

// React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// ============================================
// GLOBAL MOCKS
// ============================================

// Console warnings suppression (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Fetch mock (if needed)
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);
