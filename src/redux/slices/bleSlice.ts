import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// =============================================================================
// TYPES - Serializable versions for Redux
// =============================================================================

export interface SerializableDevice {
  id: string;
  name: string | null;
  localName: string | null;
  isConnectable: boolean | null;
  serviceUUIDs: string[] | null;
  manufacturerData: string | null;
}

export interface WiFiNetwork {
  ssid: string;
  signal: number;
  security: string;
}

// =============================================================================
// STATUS CODES - must match config.py on Jetson
// =============================================================================

export const WiFiStatus = {
  WAITING: 0,
  CONNECTING: 1,
  SUCCESS: 2,
  ERROR: 3,
} as const;

export const WiFiScanStatus = {
  IDLE: 0,
  SCANNING: 1,
  COMPLETED: 2,
  ERROR: 3,
} as const;

// =============================================================================
// STATE
// =============================================================================

export interface BleState {
  devices: SerializableDevice[];
  isScanning: boolean;
  isConnected: boolean;
  connectedDeviceId: string | null;
  error: string | null;
  wifiStatus: number;
  wifiNetworks: WiFiNetwork[];
  wifiScanStatus: number;
  criticalDisconnection: boolean;
}

const initialState: BleState = {
  devices: [],
  isScanning: false,
  isConnected: false,
  connectedDeviceId: null,
  error: null,
  wifiStatus: WiFiStatus.WAITING,
  wifiNetworks: [],
  wifiScanStatus: WiFiScanStatus.IDLE,
  criticalDisconnection: false,
};

// =============================================================================
// SLICE
// =============================================================================

const bleSlice = createSlice({
  name: 'ble',
  initialState,
  reducers: {
    // Device actions
    setDevices: (state, action: PayloadAction<SerializableDevice[]>) => {
      state.devices = action.payload;
    },
    addDevice: (state, action: PayloadAction<SerializableDevice>) => {
      const exists = state.devices.find((d) => d.id === action.payload.id);
      if (!exists) {
        state.devices.push(action.payload);
      }
    },
    clearDevices: (state) => {
      state.devices = [];
    },

    // Scanning actions
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },

    // Connection actions
    setConnected: (
      state,
      action: PayloadAction<{ isConnected: boolean; deviceId?: string | null }>
    ) => {
      state.isConnected = action.payload.isConnected;
      state.connectedDeviceId = action.payload.deviceId ?? null;
    },

    // Error actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    setWifiStatus: (state, action: PayloadAction<number>) => {
      state.wifiStatus = action.payload;
    },

    setWifiNetworks: (state, action: PayloadAction<WiFiNetwork[]>) => {
      state.wifiNetworks = action.payload;
    },

    setWifiScanStatus: (state, action: PayloadAction<number>) => {
      state.wifiScanStatus = action.payload;
    },

    // Reset all state
    resetBleState: (state) => {
      state.devices = initialState.devices;
      state.isScanning = initialState.isScanning;
      state.isConnected = initialState.isConnected;
      state.connectedDeviceId = initialState.connectedDeviceId;
      state.error = initialState.error;
      state.wifiStatus = initialState.wifiStatus;
      state.wifiNetworks = initialState.wifiNetworks;
      state.wifiScanStatus = initialState.wifiScanStatus;
    },

    // Reset connection-related state (on disconnect)
    resetConnectionState: (state) => {
      state.isConnected = false;
      state.connectedDeviceId = null;
      state.wifiStatus = WiFiStatus.WAITING;
      state.wifiNetworks = [];
      state.wifiScanStatus = WiFiScanStatus.IDLE;
    },

    // Reset only WiFi-related state (keep BLE connection)
    resetWifiState: (state) => {
      state.wifiStatus = WiFiStatus.WAITING;
      state.wifiNetworks = [];
      state.wifiScanStatus = WiFiScanStatus.IDLE;
    },

    // Critical disconnection requiring user attention
    setCriticalDisconnection: (state, action: PayloadAction<boolean>) => {
      state.criticalDisconnection = action.payload;
    },
  },
});

export const {
  setDevices,
  addDevice,
  clearDevices,
  setScanning,
  setConnected,
  setError,
  clearError,
  setWifiStatus,
  setWifiNetworks,
  setWifiScanStatus,
  resetBleState,
  resetConnectionState,
  resetWifiState,
  setCriticalDisconnection,
} = bleSlice.actions;

export default bleSlice.reducer;
