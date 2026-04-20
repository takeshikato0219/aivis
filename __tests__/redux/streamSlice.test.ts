import reducer, {
  setStatus,
  setMode,
  setError,
  setMicState,
  setStall,
  clearStall,
  setTokenInfo,
  incrementRetry,
  resetRetry,
  reset,
  StreamStatus,
  MicState,
  type StreamState,
  type TokenInfo,
} from '../../src/redux/slices/streamSlice';

describe('streamSlice', () => {
  const initialState: StreamState = {
    status: StreamStatus.DISCONNECTED,
    mode: '',
    error: null,
    micState: MicState.IDLE,
    isStalled: false,
    stallReason: '',
    reconnectAttempt: 0,
    retryCount: 0,
    tokenInfo: {
      isValid: false,
      expTime: null,
      startTime: null,
      expMinutes: 0,
      remainingMs: 0,
      remainingLabel: '--:--',
    },
  };

  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle setStatus', () => {
    const state = reducer(initialState, setStatus(StreamStatus.CONNECTED));
    expect(state.status).toBe(StreamStatus.CONNECTED);
  });

  it('should handle setMode', () => {
    const state = reducer(initialState, setMode('live'));
    expect(state.mode).toBe('live');
  });

  it('should handle setError', () => {
    const state = reducer(initialState, setError('error message'));
    expect(state.error).toBe('error message');
  });

  it('should handle setMicState', () => {
    const state = reducer(initialState, setMicState(MicState.STREAMING));
    expect(state.micState).toBe(MicState.STREAMING);
  });

  it('should handle setStall', () => {
    const state = reducer(initialState, setStall('reason'));
    expect(state.isStalled).toBe(true);
    expect(state.stallReason).toBe('reason');
    expect(state.reconnectAttempt).toBe(1);
    expect(state.status).toBe(StreamStatus.CONNECTING);
  });

  it('should handle clearStall', () => {
    const stalledState = {
      ...initialState,
      isStalled: true,
      stallReason: 'reason',
      reconnectAttempt: 2,
      error: 'err',
      status: StreamStatus.CONNECTING,
    };
    const state = reducer(stalledState, clearStall());
    expect(state.isStalled).toBe(false);
    expect(state.stallReason).toBe('');
    expect(state.reconnectAttempt).toBe(0);
    expect(state.error).toBeNull();
    expect(state.status).toBe(StreamStatus.CONNECTED);
  });

  it('should handle setTokenInfo', () => {
    const tokenInfo: TokenInfo = {
      isValid: true,
      expTime: '2026-04-16T00:00:00Z',
      startTime: '2026-04-15T23:00:00Z',
      expMinutes: 60,
      remainingMs: 1000,
      remainingLabel: '00:01',
    };
    const state = reducer(initialState, setTokenInfo(tokenInfo));
    expect(state.tokenInfo).toEqual(tokenInfo);
  });

  it('should handle incrementRetry', () => {
    const state = reducer(initialState, incrementRetry());
    expect(state.retryCount).toBe(1);
  });

  it('should handle resetRetry', () => {
    const stateWithRetry = { ...initialState, retryCount: 5 };
    const state = reducer(stateWithRetry, resetRetry());
    expect(state.retryCount).toBe(0);
  });

  it('should handle reset', () => {
    const modifiedState = { ...initialState, status: StreamStatus.ERROR, mode: 'x', retryCount: 2 };
    const state = reducer(modifiedState, reset());
    expect(state).toEqual(initialState);
  });
});
