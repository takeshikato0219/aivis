import { renderHook } from '@testing-library/react-native';
import { useAppSetup } from '@hooks/useAppSetup';

jest.mock('@utils/errorHandler', () => ({
  setScreen: jest.fn(),
}));
jest.mock('@utils/networkMonitor', () => {
  return {
    addListener: jest.fn((cb) => {
      cb({ isConnected: true });
      return jest.fn(); // unsubscribe function
    }),
    isConnected: jest.fn(() => true),
  };
});

jest.mock('@utils/crashReporter', () => ({
  sendPendingReports: jest.fn(),
}));

describe('useAppSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cleans up network listener on unmount', () => {
    const NetworkMonitor = require('@utils/networkMonitor');
    const unsubscribe = jest.fn();
    NetworkMonitor.addListener.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useAppSetup());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
