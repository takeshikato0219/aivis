import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useMic } from '@hooks/useMic';
import streamReducer, { MicState, setMicState } from '@redux/slices/streamSlice';

jest.mock('@types/webrtc', () => ({
  isStreamURLValid: jest.fn(() => true),
}));

jest.mock('react-native-live-audio-stream', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    on: jest.fn(),
  },
}));

const isStreamURLValid = require('@types/webrtc').isStreamURLValid as jest.Mock;
const mockLiveAudio = require('react-native-live-audio-stream').default;

const VALID_MIC_URL = 'wss://example.com/mic?token=test';

function renderUseMic(
  config: Parameters<typeof useMic>[0] = {},
  preloadMic?: MicState
) {
  const store = configureStore({ reducer: { stream: streamReducer } });
  if (preloadMic !== undefined) {
    store.dispatch(setMicState(preloadMic));
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const rendered = renderHook(() => useMic(config), { wrapper });
  return { ...rendered, store };
}

describe('useMic', () => {
  const originalWS = global.WebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    (isStreamURLValid as jest.Mock).mockReturnValue(true);
    Platform.OS = 'android';
    global.WebSocket = originalWS;
  });

  afterEach(() => {
    global.WebSocket = originalWS;
  });

  it('returns micState and handlers', () => {
    const { result } = renderUseMic();
    expect(result.current.micState).toBe(MicState.IDLE);
    expect(typeof result.current.startMic).toBe('function');
    expect(typeof result.current.stopMic).toBe('function');
    expect(typeof result.current.toggleMic).toBe('function');
    expect(typeof result.current.handleMicMessage).toBe('function');
  });

  describe('Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('dispatches error when mic URL is invalid', async () => {
      (isStreamURLValid as jest.Mock).mockReturnValue(false);
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };
      const { result, store } = renderUseMic({ micUrl: 'bad', webViewRef });

      await act(async () => {
        await result.current.startMic();
      });

      expect(store.getState().stream.error).toBe('Invalid Mic token');
      expect(injectJavaScript).not.toHaveBeenCalled();
    });

    it('dispatches error when WebView ref is missing', async () => {
      const { result, store } = renderUseMic({ micUrl: VALID_MIC_URL });

      await act(async () => {
        await result.current.startMic();
      });

      expect(store.getState().stream.error).toBe('WebView not ready');
    });

    it('injects start script when URL is valid and WebView is ready', async () => {
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };
      const { result } = renderUseMic({ micUrl: VALID_MIC_URL, webViewRef });

      await act(async () => {
        await result.current.startMic();
      });

      expect(injectJavaScript).toHaveBeenCalledTimes(1);
      const script = injectJavaScript.mock.calls[0][0] as string;
      expect(script).toContain('__mic_state');
      expect(script).toContain(VALID_MIC_URL);
      expect(script).toContain('type=android');
    });

    it('handleMicMessage updates mic state for __mic_state payloads', () => {
      const { result, store } = renderUseMic();

      act(() => {
        result.current.handleMicMessage({ type: '__mic_state', state: 'connecting' });
      });
      expect(store.getState().stream.micState).toBe(MicState.CONNECTING);

      act(() => {
        result.current.handleMicMessage({ type: '__mic_state', state: 'streaming' });
      });
      expect(store.getState().stream.micState).toBe(MicState.STREAMING);

      act(() => {
        result.current.handleMicMessage({ type: '__mic_state', state: 'stopped' });
      });
      expect(store.getState().stream.micState).toBe(MicState.STOPPED);
    });

    it('handleMicMessage sets error on error state', () => {
      const { result, store } = renderUseMic();

      act(() => {
        result.current.handleMicMessage({
          type: '__mic_state',
          state: 'error',
          error: 'test failure',
        });
      });

      expect(store.getState().stream.error).toBe('Mic: test failure');
      expect(store.getState().stream.micState).toBe(MicState.STOPPED);
    });

    it('ignores non-__mic_state messages', () => {
      const { result, store } = renderUseMic();

      act(() => {
        result.current.handleMicMessage({ type: 'other', state: 'streaming' });
      });

      expect(store.getState().stream.micState).toBe(MicState.IDLE);
    });

    it('stopMic injects cleanup script and sets STOPPED', () => {
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };
      const { result, store } = renderUseMic({ webViewRef });

      act(() => {
        result.current.stopMic();
      });

      expect(injectJavaScript).toHaveBeenCalled();
      const script = injectJavaScript.mock.calls[0][0] as string;
      expect(script).toContain('__micCleanup');
      expect(store.getState().stream.micState).toBe(MicState.STOPPED);
    });

    it('toggleMic calls stopMic when streaming', async () => {
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };
      const store = configureStore({ reducer: { stream: streamReducer } });
      store.dispatch(setMicState(MicState.STREAMING));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );
      const { result } = renderHook(
        () => useMic({ micUrl: VALID_MIC_URL, webViewRef }),
        { wrapper }
      );

      await act(async () => {
        await result.current.toggleMic();
      });

      expect(injectJavaScript).toHaveBeenCalled();
      expect(store.getState().stream.micState).toBe(MicState.STOPPED);
    });

    it('toggleMic calls startMic when idle', async () => {
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };
      const { result } = renderUseMic({ micUrl: VALID_MIC_URL, webViewRef });

      await act(async () => {
        await result.current.toggleMic();
      });

      expect(injectJavaScript).toHaveBeenCalled();
    });

    it('autoStart runs startMic when micUrl is valid', async () => {
      const injectJavaScript = jest.fn();
      const webViewRef = { current: { injectJavaScript } };

      renderHook(() => useMic({ micUrl: VALID_MIC_URL, autoStart: true, webViewRef }), {
        wrapper: ({ children }) => (
          <Provider store={configureStore({ reducer: { stream: streamReducer } })}>
            {children}
          </Provider>
        ),
      });

      await waitFor(() => {
        expect(injectJavaScript).toHaveBeenCalled();
      });
    });
  });

  describe('iOS (NativeMic + WebSocket)', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
      const instances: { onopen: (() => void) | null }[] = [];
      global.WebSocket = jest.fn().mockImplementation(() => {
        const ws = {
          binaryType: 'arraybuffer',
          readyState: 0,
          onopen: null as (() => void) | null,
          onclose: null,
          onerror: null,
          onmessage: null,
          send: jest.fn(),
          close: jest.fn(),
        };
        instances.push(ws);
        queueMicrotask(() => {
          ws.readyState = 1;
          ws.onopen?.();
        });
        return ws;
      }) as unknown as typeof WebSocket;
      (global.WebSocket as unknown as { OPEN: number }).OPEN = 1;
      (global.WebSocket as unknown as { CONNECTING: number }).CONNECTING = 0;
    });

    it('initializes native audio and reaches STREAMING after WS opens', async () => {
      const { result, store } = renderUseMic({ micUrl: VALID_MIC_URL });

      await act(async () => {
        await result.current.startMic();
      });

      expect(mockLiveAudio.init).toHaveBeenCalled();
      expect(mockLiveAudio.on).toHaveBeenCalledWith('data', expect.any(Function));

      await waitFor(() => {
        expect(store.getState().stream.micState).toBe(MicState.STREAMING);
      });

      expect(mockLiveAudio.start).toHaveBeenCalled();
    });

    it('append type=ios to websocket URL', async () => {
      const { result } = renderUseMic({ micUrl: 'wss://host/path' });

      await act(async () => {
        await result.current.startMic();
      });

      expect(global.WebSocket).toHaveBeenCalledWith('wss://host/path?type=ios');
    });

    it('stopMic destroys native mic and sets STOPPED', async () => {
      const { result, store } = renderUseMic({ micUrl: VALID_MIC_URL });

      await act(async () => {
        await result.current.startMic();
      });

      await waitFor(() => {
        expect(store.getState().stream.micState).toBe(MicState.STREAMING);
      });

      act(() => {
        result.current.stopMic();
      });

      expect(mockLiveAudio.stop).toHaveBeenCalled();
      expect(store.getState().stream.micState).toBe(MicState.STOPPED);
    });
  });
});
