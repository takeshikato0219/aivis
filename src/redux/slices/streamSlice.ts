import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum StreamStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

export enum MicState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  STREAMING = 'STREAMING',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenInfo {
  isValid: boolean;
  expTime: string | null;
  startTime: string | null;
  expMinutes: number;
  remainingMs: number;
  remainingLabel: string;
}

export interface StreamState {
  status: StreamStatus;
  mode: string;
  error: string | null;
  micState: MicState;
  isStalled: boolean;
  stallReason: string;
  reconnectAttempt: number;
  retryCount: number;
  tokenInfo: TokenInfo;
}

// ─── Initial State ────────────────────────────────────────────────────────────

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

// ─── Slice ────────────────────────────────────────────────────────────────────

const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<StreamStatus>) {
      state.status = action.payload;
    },
    setMode(state, action: PayloadAction<string>) {
      state.mode = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setMicState(state, action: PayloadAction<MicState>) {
      state.micState = action.payload;
    },
    setStall(state, action: PayloadAction<string>) {
      state.isStalled = true;
      state.stallReason = action.payload;
      state.reconnectAttempt += 1;
      state.status = StreamStatus.CONNECTING;
    },
    clearStall(state) {
      state.isStalled = false;
      state.stallReason = '';
      state.reconnectAttempt = 0;
      state.error = null;
      state.status = StreamStatus.CONNECTED;
    },
    setTokenInfo(state, action: PayloadAction<TokenInfo>) {
      state.tokenInfo = action.payload;
    },
    incrementRetry(state) {
      state.retryCount += 1;
    },
    resetRetry(state) {
      state.retryCount = 0;
    },
    reset: () => initialState,
  },
});

export const {
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
} = streamSlice.actions;

export default streamSlice.reducer;
