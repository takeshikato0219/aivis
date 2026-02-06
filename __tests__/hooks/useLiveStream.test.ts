import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLiveStream } from '@hooks/useLiveStream';

// Mock timers
jest.useFakeTimers();

// Mock WebView ref
const mockWebViewRef = {
  current: {
    reload: jest.fn(),
  },
};

describe('useLiveStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initial state', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useLiveStream());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.connectionStatus).toBe('connecting');
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.webViewRef.current).toBeNull();
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        maxRetries: 10,
        heartbeatInterval: 5000,
        retryBaseDelay: 1000,
      };

      const { result } = renderHook(() => useLiveStream(customConfig));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.connectionStatus).toBe('connecting');
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isReconnecting).toBe(false);
    });
  });

  describe('initial loading', () => {
    it('should set loading to false after random initial loading time', async () => {
      // Mock Math.random to return 0.5 for predictable testing
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const { result } = renderHook(() => useLiveStream());

      // Initial loading time = Math.floor(0.5 * (10000 - 5000)) + 5000 = 7500ms
      expect(result.current.isLoading).toBe(true);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(7500);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Restore Math.random
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('should not override loading state if WebView loads first', async () => {
      const { result } = renderHook(() => useLiveStream());

      // Simulate WebView loading first
      act(() => {
        result.current.handleWebViewLoad();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.connectionStatus).toBe('connected');

      // Fast-forward past initial loading time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Loading state should remain false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('WebView event handlers', () => {
    describe('handleWebViewLoad', () => {
      it('should update state when WebView loads successfully', () => {
        const { result } = renderHook(() => useLiveStream());

        act(() => {
          result.current.handleWebViewLoad();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.connectionStatus).toBe('connected');
        expect(result.current.isReconnecting).toBe(false);
        expect(result.current.retryCount).toBe(0);
      });

      it('should start heartbeat monitoring', () => {
        const { result } = renderHook(() => useLiveStream());

        act(() => {
          result.current.handleWebViewLoad();
        });

        // Advance time to trigger heartbeat check
        act(() => {
          jest.advanceTimersByTime(3000); // Default heartbeat interval
        });

        // Should not trigger connection lost yet (heartbeat timeout is 10000ms)
        expect(result.current.connectionStatus).toBe('connected');
      });

      it('should clear pending retry timers', () => {
        const { result } = renderHook(() => useLiveStream());

        // Simulate a retry timer being set
        act(() => {
          result.current.handleWebViewError();
        });

        act(() => {
          result.current.handleWebViewLoad();
        });

        expect(result.current.retryCount).toBe(0);
      });
    });

    describe('handleWebViewError', () => {
      it('should set loading to false and trigger connection lost handling', () => {
        const { result } = renderHook(() => useLiveStream());

        act(() => {
          result.current.handleWebViewError();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isReconnecting).toBe(true);
        expect(result.current.connectionStatus).toBe('connecting');
      });
    });

    describe('handleWebViewHttpError', () => {
      it('should handle HTTP errors', () => {
        const { result } = renderHook(() => useLiveStream());
        const mockSyntheticEvent = {
          nativeEvent: {
            statusCode: 404,
            url: 'http://example.com',
          },
        };

        act(() => {
          result.current.handleWebViewHttpError(mockSyntheticEvent);
        });

        // Just check that it triggers reconnection logic
        expect(result.current.isReconnecting).toBe(true);
      });
    });

    describe('handleManualRetry', () => {
      it('should reset state and reload WebView', () => {
        const { result } = renderHook(() => useLiveStream());

        // Mock the webViewRef after render
        // @ts-ignore
        result.current.webViewRef.current = mockWebViewRef.current;

        // Set some state first - simulate that we had some retries
        act(() => {
          // Manually set retry count to simulate previous retries
          (result.current as any).retryCount = 2;
          result.current.handleWebViewError();
        });

        act(() => {
          result.current.handleManualRetry();
        });

        expect(result.current.retryCount).toBe(0);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.connectionStatus).toBe('connecting');
        expect(result.current.isReconnecting).toBe(false);
        expect(mockWebViewRef.current.reload).toHaveBeenCalled();
      });
    });
  });

  describe('WebView message handling', () => {
    it('should handle heartbeat messages', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      // Heartbeat should be processed without errors
      expect(result.current.connectionStatus).toBe('connecting');
    });

    it('should handle connection-lost messages', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'connection-lost',
            reason: 'iframe-error',
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      expect(result.current.isReconnecting).toBe(true);
    });

    it('should handle connection-restored messages', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'connection-restored',
            reason: 'network-online',
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should handle error messages with connection keywords', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'error',
            message: 'Network connection failed',
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      expect(result.current.isReconnecting).toBe(true);
    });

    it('should handle error messages without connection keywords', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'error',
            message: 'Some other error',
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      // Should not trigger reconnection for non-connection errors
      expect(result.current.isReconnecting).toBe(false);
    });

    it('should handle malformed JSON gracefully', () => {
      const { result } = renderHook(() => useLiveStream());
      const mockEvent = {
        nativeEvent: {
          data: 'invalid json',
        },
      };

      // Should not crash
      expect(() => {
        act(() => {
          result.current.handleWebViewMessage(mockEvent);
        });
      }).not.toThrow();
    });
  });

  describe('retry logic', () => {
    it('should retry with exponential backoff', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          maxRetries: 3,
          retryBaseDelay: 1000,
        })
      );

      // Mock the webViewRef after render
      // @ts-ignore
      result.current.webViewRef.current = mockWebViewRef.current;

      // Trigger first error
      act(() => {
        result.current.handleWebViewError();
      });

      expect(result.current.isReconnecting).toBe(true);

      // Fast-forward past first retry delay (1000ms) - this should trigger retry
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.retryCount).toBe(1);
      expect(mockWebViewRef.current.reload).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries limit', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          maxRetries: 2,
          retryBaseDelay: 100,
        })
      );

      // Trigger errors multiple times
      act(() => {
        result.current.handleWebViewError(); // retry 1
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.handleWebViewError(); // retry 2
      });
      act(() => {
        jest.advanceTimersByTime(200); // 100 * 2^1 = 200ms
      });

      act(() => {
        result.current.handleWebViewError(); // should fail now
      });

      expect(result.current.connectionStatus).toBe('failed');
      expect(result.current.isReconnecting).toBe(false);
    });

    it('should respect retry max delay', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          maxRetries: 10,
          retryBaseDelay: 1000,
          retryMaxDelay: 5000,
        })
      );

      // Mock the webViewRef after render
      // @ts-ignore
      result.current.webViewRef.current = mockWebViewRef.current;

      // Trigger multiple retries to reach max delay
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.handleWebViewError();
        });

        // Calculate expected delay: min(1000 * 2^i, 5000)
        const expectedDelay = Math.min(1000 * Math.pow(2, i), 5000);

        act(() => {
          jest.advanceTimersByTime(expectedDelay);
        });
      }

      expect(mockWebViewRef.current.reload).toHaveBeenCalledTimes(5);
    });
  });

  describe('heartbeat monitoring', () => {
    it('should detect heartbeat timeout', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          heartbeatInterval: 1000,
          heartbeatTimeout: 3000,
        })
      );

      // Load WebView to start heartbeat monitoring
      act(() => {
        result.current.handleWebViewLoad();
      });

      // Advance time past heartbeat timeout
      act(() => {
        jest.advanceTimersByTime(4000); // > 3000ms timeout
      });

      expect(result.current.isReconnecting).toBe(true);
    });

    it('should reset heartbeat on WebView messages', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          heartbeatInterval: 1000,
          heartbeatTimeout: 3000,
        })
      );

      // Load WebView
      act(() => {
        result.current.handleWebViewLoad();
      });

      // Advance time partially
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Send heartbeat message
      const mockEvent = {
        nativeEvent: {
          data: JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
          }),
        },
      };

      act(() => {
        result.current.handleWebViewMessage(mockEvent);
      });

      // Advance time again - should not time out now
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isReconnecting).toBe(false);
    });
  });

  describe('injected JavaScript', () => {
    it('should generate JavaScript with correct heartbeat interval', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          heartbeatInterval: 5000,
        })
      );

      const injectedJS = result.current.getInjectedJavaScript();

      expect(injectedJS).toContain('heartbeatInterval = setInterval(sendHeartbeat, 5000)');
      expect(injectedJS).toContain('window.onerror');
      expect(injectedJS).toContain('window.ReactNativeWebView.postMessage');
      expect(injectedJS).toContain('sendHeartbeat');
      expect(injectedJS).toContain('monitorIframe');
    });

    it('should include error handling in injected JavaScript', () => {
      const { result } = renderHook(() => useLiveStream());

      const injectedJS = result.current.getInjectedJavaScript();

      expect(injectedJS).toContain('window.onerror = function(msg, url, line, col, error)');
      expect(injectedJS).toContain("console.error('Iframe error detected')");
      expect(injectedJS).toContain("window.addEventListener('online'");
      expect(injectedJS).toContain("window.addEventListener('offline'");
    });

    it('should include heartbeat monitoring in injected JavaScript', () => {
      const { result } = renderHook(() => useLiveStream());

      const injectedJS = result.current.getInjectedJavaScript();

      expect(injectedJS).toContain('function sendHeartbeat()');
      expect(injectedJS).toContain("type: 'heartbeat'");
      expect(injectedJS).toContain('lastHeartbeatTime = Date.now()');
    });
  });

  describe('cleanup', () => {
    it('should clear all timers on cleanup', () => {
      const { result } = renderHook(() => useLiveStream());

      // Load WebView to start timers
      act(() => {
        result.current.handleWebViewLoad();
      });

      // Trigger error to start retry timer
      act(() => {
        result.current.handleWebViewError();
      });

      // Call cleanup
      act(() => {
        result.current.cleanup();
      });

      // Advance time - timers should not trigger
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // WebView reload should not be called (retry timer cleared)
      expect(mockWebViewRef.current.reload).not.toHaveBeenCalled();
    });

    it('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useLiveStream());

      // Load WebView to start timers
      act(() => {
        result.current.handleWebViewLoad();
      });

      // Trigger error to start retry timer
      act(() => {
        result.current.handleWebViewError();
      });

      // Unmount component
      unmount();

      // Advance time - timers should not trigger
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // WebView reload should not be called (timers cleared)
      expect(mockWebViewRef.current.reload).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const { result } = renderHook(() => useLiveStream());

      // Mock the webViewRef after render
      // @ts-ignore
      result.current.webViewRef.current = mockWebViewRef.current;

      // Test that hook initializes without errors
      expect(result.current).toBeDefined();

      // Test that default values are used by checking retry logic
      act(() => {
        result.current.handleWebViewError();
      });

      // First retry should use default retryBaseDelay (2000ms)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockWebViewRef.current.reload).toHaveBeenCalledTimes(1);
    });

    it('should merge custom config with defaults', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          maxRetries: 3,
          heartbeatInterval: 5000,
        })
      );

      expect(result.current).toBeDefined();

      // Test custom maxRetries
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.handleWebViewError();
        });
        act(() => {
          jest.advanceTimersByTime(2000 * Math.pow(2, i)); // Use default retryBaseDelay
        });
      }

      // Should not fail after 3 retries (custom maxRetries)
      act(() => {
        result.current.handleWebViewError();
      });

      expect(result.current.connectionStatus).toBe('failed');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid consecutive errors', () => {
      const { result } = renderHook(() =>
        useLiveStream({
          maxRetries: 2, // Set to 2 so it fails after 3 errors
          retryBaseDelay: 100,
        })
      );

      // Mock the webViewRef after render
      // @ts-ignore
      result.current.webViewRef.current = mockWebViewRef.current;

      // Trigger first error and wait for retry
      act(() => {
        result.current.handleWebViewError();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Trigger second error and wait for retry
      act(() => {
        result.current.handleWebViewError();
      });
      act(() => {
        jest.advanceTimersByTime(200); // 100 * 2^1
      });

      // Trigger third error - should fail now
      act(() => {
        result.current.handleWebViewError();
      });

      expect(result.current.connectionStatus).toBe('failed');
      expect(result.current.isReconnecting).toBe(false);
    });

    it('should handle WebView load after error recovery', () => {
      const { result } = renderHook(() => useLiveStream());

      // Trigger error and start retry
      act(() => {
        result.current.handleWebViewError();
      });

      expect(result.current.isReconnecting).toBe(true);

      // Simulate successful reload
      act(() => {
        result.current.handleWebViewLoad();
      });

      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.retryCount).toBe(0);
    });

    it('should handle manual retry during automatic retry', () => {
      const { result } = renderHook(() => useLiveStream());

      // Start automatic retry
      act(() => {
        result.current.handleWebViewError();
      });

      expect(result.current.isReconnecting).toBe(true);

      // Manual retry should reset everything
      act(() => {
        result.current.handleManualRetry();
      });

      expect(result.current.retryCount).toBe(0);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.connectionStatus).toBe('connecting');
    });
  });
});
