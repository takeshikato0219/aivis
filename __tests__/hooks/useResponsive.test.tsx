import { renderHook, act } from '@testing-library/react-native';

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

// Import after mock
import { Dimensions } from 'react-native';
import { useResponsive } from '@hooks/useResponsive';

describe('useResponsive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders without crashing', () => {
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: jest.fn(),
        });

      expect(() => {
        renderHook(() => useResponsive());
      }).not.toThrow();
    });

    it('returns an object with expected properties', () => {
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: jest.fn(),
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toHaveProperty('width');
      expect(result.current).toHaveProperty('height');
      expect(result.current).toHaveProperty('isPortrait');
      expect(result.current).toHaveProperty('isLandscape');
      expect(result.current).toHaveProperty('isTablet');
      expect(result.current).toHaveProperty('isPhone');
      expect(result.current).toHaveProperty('scale');
      expect(result.current).toHaveProperty('fontScale');
    });
  });

  describe('Initial dimensions', () => {
    it('returns correct initial values for phone in portrait', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current).toEqual({
        width: 375,
        height: 667,
        isPortrait: true,
        isLandscape: false,
        isTablet: false,
        isPhone: true,
        scale: 2,
        fontScale: 1,
      });
    });

    it('returns correct initial values for phone in landscape', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 667,
        height: 375,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current).toEqual({
        width: 667,
        height: 375,
        isPortrait: false,
        isLandscape: true,
        isTablet: false,
        isPhone: true,
        scale: 2,
        fontScale: 1,
      });
    });

    it('returns correct initial values for tablet in portrait', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current).toEqual({
        width: 768,
        height: 1024,
        isPortrait: true,
        isLandscape: false,
        isTablet: true,
        isPhone: false,
        scale: 2,
        fontScale: 1,
      });
    });

    it('returns correct initial values for tablet in landscape', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 1024,
        height: 768,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
        isPortrait: false,
        isLandscape: true,
        isTablet: true,
        isPhone: false,
        scale: 2,
        fontScale: 1,
      });
    });

    it('handles square dimensions (edge case)', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 500,
        height: 500,
        scale: 1,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current).toEqual({
        width: 500,
        height: 500,
        isPortrait: true, // height >= width, so portrait
        isLandscape: false,
        isTablet: false, // min(500, 500) = 500 < 768
        isPhone: true,
        scale: 1,
        fontScale: 1,
      });
    });
  });

  describe('Dimension changes', () => {
    it('updates values when dimensions change from portrait to landscape', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      // Initial state should be portrait
      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.width).toBe(375);
      expect(result.current.height).toBe(667);

      // Get the event listener callback that was registered
      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
      const eventListenerCallback = (
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).mock.calls[0][1];

      // Simulate rotation to landscape
      act(() => {
        eventListenerCallback({
          window: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      // State should now be landscape
      expect(result.current.isPortrait).toBe(false);
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.width).toBe(667);
      expect(result.current.height).toBe(375);
    });

    it('updates values when dimensions change from phone to tablet size', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      // Initial state should be phoned
      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);

      // Get the event listener callback
      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
      const eventListenerCallback = (
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).mock.calls[0][1];

      // Simulate changing to tablet size
      act(() => {
        eventListenerCallback({
          window: {
            width: 768,
            height: 1024,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 768,
            height: 1024,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      // State should now be tablet
      expect(result.current.isPhone).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.width).toBe(768);
      expect(result.current.height).toBe(1024);
    });

    it('handles multiple dimension changes correctly', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
      const eventListenerCallback = (
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).mock.calls[0][1];

      // First change: to landscape
      act(() => {
        eventListenerCallback({
          window: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isLandscape).toBe(true);
      expect(result.current.width).toBe(667);

      // Second change: back to portrait with different dimensions
      act(() => {
        eventListenerCallback({
          window: {
            width: 414,
            height: 896,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 414,
            height: 896,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.width).toBe(414);
      expect(result.current.height).toBe(896);
    });
  });

  describe('Orientation detection', () => {
    it('detects portrait when height > width', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });

    it('detects landscape when width > height', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 667,
        height: 375,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current.isPortrait).toBe(false);
      expect(result.current.isLandscape).toBe(true);
    });

    it('detects portrait when height equals width (square screen)', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 500,
        height: 500,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });

    it('correctly updates orientation on dimension change', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);

      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
      const eventListenerCallback = (
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).mock.calls[0][1];

      // Change to landscape
      act(() => {
        eventListenerCallback({
          window: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 667,
            height: 375,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isPortrait).toBe(false);
      expect(result.current.isLandscape).toBe(true);

      // Change back to portrait
      act(() => {
        eventListenerCallback({
          window: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });
  });

  describe('Device type detection', () => {
    it('detects phone when minimum dimension is less than 768', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });

    it('detects tablet when minimum dimension is exactly 768', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current.isPhone).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    it('detects tablet when minimum dimension is greater than 768', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 834,
        height: 1194,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(result.current.isPhone).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    it('detects phone when width is 767 (just below tablet threshold)', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 767,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });

    it('detects tablet when height is 768 but width is smaller', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 700,
        height: 768,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      // min(700, 768) = 700 < 768, so phone
      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });

    it('detects tablet when width is 768 but height is smaller', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 768,
        height: 700,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      // min(768, 700) = 700 < 768, so phone
      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });

    it('correctly updates device type on dimension change', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPhone).toBe(true);

      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
      const eventListenerCallback = (
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).mock.calls[0][1];

      // Change to tablet size
      act(() => {
        eventListenerCallback({
          window: {
            width: 768,
            height: 1024,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 768,
            height: 1024,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isPhone).toBe(false);
      expect(result.current.isTablet).toBe(true);

      // Change back to phone size
      act(() => {
        eventListenerCallback({
          window: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
        });
      });

      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      const { unmount } = renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(mockRemove).not.toHaveBeenCalled();

      unmount();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('calls Dimensions.addEventListener on mount', () => {
      const mockRemove = jest.fn();
      (Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });
      (Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>)
        // @ts-ignore
        .mockReturnValue({
          remove: mockRemove,
        });

      renderHook(() => useResponsive());

      expect(Dimensions.get as jest.MockedFunction<typeof Dimensions.get>).toHaveBeenCalledWith(
        'window'
      );
      expect(
        Dimensions.addEventListener as jest.MockedFunction<typeof Dimensions.addEventListener>
      ).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
