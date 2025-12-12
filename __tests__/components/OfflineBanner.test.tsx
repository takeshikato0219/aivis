import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import OfflineBanner from '@components/OfflineBanner/OfflineBanner';

// ============================================
// SETUP MOCKS BEFORE IMPORTS
// ============================================

// Mock Animated. timing
const mockStart = jest.fn();
jest.spyOn(Animated, 'timing').mockImplementation(
  () =>
    ({
      start: mockStart,
      stop: jest.fn(),
      reset: jest.fn(),
    }) as any
);

// Mock NetworkMonitor module
const mockIsConnected = jest.fn();
const mockAddListener = jest.fn();
const mockUnsubscribe = jest.fn();

// Set default return for addListener
mockAddListener.mockReturnValue(mockUnsubscribe);

// Mock the entire module
jest.mock('@utils/networkMonitor', () => {
  return {
    __esModule: true,
    default: {
      isConnected: () => mockIsConnected(),
      addListener: (callback: any) => mockAddListener(callback),
    },
  };
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'offline.title': 'No Internet Connection',
      };
      return translations[key] || key;
    },
  }),
}));

// ============================================
// TESTS
// ============================================
describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddListener.mockReturnValue(mockUnsubscribe);
  });

  describe('when online', () => {
    beforeEach(() => {
      mockIsConnected.mockReturnValue(true);
    });

    it('renders nothing when online', () => {
      const { toJSON, queryByText } = render(<OfflineBanner />);

      expect(toJSON()).toBeNull();
      expect(queryByText(/No Internet Connection/i)).toBeNull();
    });
  });

  describe('when offline', () => {
    beforeEach(() => {
      mockIsConnected.mockReturnValue(false);
    });

    it('renders banner when offline', () => {
      const { getByText } = render(<OfflineBanner />);

      expect(getByText(/No Internet Connection/i)).toBeTruthy();
    });

    it('shows warning emoji with offline message', () => {
      const { getByText } = render(<OfflineBanner />);

      expect(getByText(/⚠️/)).toBeTruthy();
      expect(getByText(/No Internet Connection/i)).toBeTruthy();
    });
  });

  describe('network listener', () => {
    it('subscribes to network changes on mount', () => {
      mockIsConnected.mockReturnValue(true);

      render(<OfflineBanner />);

      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('unsubscribes on unmount', () => {
      mockIsConnected.mockReturnValue(true);

      const { unmount } = render(<OfflineBanner />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('updates when network goes offline', async () => {
      let networkCallback: ((state: { isConnected: boolean }) => void) | null = null;

      mockAddListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      // Start online
      mockIsConnected.mockReturnValue(true);

      const { queryByText, getByText } = render(<OfflineBanner />);

      // Should not show banner
      expect(queryByText(/No Internet Connection/i)).toBeNull();

      // Go offline
      await act(async () => {
        if (networkCallback) {
          networkCallback({ isConnected: false });
        }
      });

      // Should show banner
      await waitFor(() => {
        expect(getByText(/No Internet Connection/i)).toBeTruthy();
      });
    });

    it('hides when network comes online', async () => {
      let networkCallback: ((state: { isConnected: boolean }) => void) | null = null;

      mockAddListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      // Start offline
      mockIsConnected.mockReturnValue(false);

      const { getByText, queryByText } = render(<OfflineBanner />);

      // Should show banner
      expect(getByText(/No Internet Connection/i)).toBeTruthy();

      // Go online
      await act(async () => {
        if (networkCallback) {
          networkCallback({ isConnected: true });
        }
      });

      // Should hide banner
      await waitFor(() => {
        expect(queryByText(/No Internet Connection/i)).toBeNull();
      });
    });
  });

  describe('animation behavior', () => {
    it('animates with correct duration', () => {
      const timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
        start: mockStart,
        stop: jest.fn(),
        reset: jest.fn(),
      }));

      mockIsConnected.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(timingSpy).toHaveBeenCalled();
      const animationCall = timingSpy.mock.calls[0];
      expect(animationCall).toBeDefined();
      expect(animationCall[1]).toMatchObject({
        duration: 300,
        useNativeDriver: true,
      });
    });

    it('animates on state change', async () => {
      jest.spyOn(Animated, 'timing').mockImplementation(() => ({
        start: mockStart,
        stop: jest.fn(),
        reset: jest.fn(),
      }));
      let networkCallback: ((state: { isConnected: boolean }) => void) | null = null;

      mockAddListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      mockIsConnected.mockReturnValue(true);

      render(<OfflineBanner />);

      mockStart.mockClear();

      await act(async () => {
        if (networkCallback) {
          networkCallback({ isConnected: false });
        }
      });

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });
    });
  });

  describe('initial state', () => {
    it('checks connection on mount', () => {
      mockIsConnected.mockReturnValue(true);

      render(<OfflineBanner />);

      expect(mockIsConnected).toHaveBeenCalled();
    });

    it('renders based on initial connection state', () => {
      mockIsConnected.mockReturnValue(false);

      const { getByText } = render(<OfflineBanner />);

      expect(getByText(/No Internet Connection/i)).toBeTruthy();
    });
  });
});
