import bleReducer, {
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
  WiFiStatus,
  WiFiScanStatus,
  type BleState,
  type SerializableDevice,
  type WiFiNetwork,
} from '../../../src/redux/slices/bleSlice';

describe('bleSlice', () => {
  const mockDevice1: SerializableDevice = {
    id: 'device-1',
    name: 'Test Device 1',
    localName: 'Test Local 1',
    isConnectable: true,
    serviceUUIDs: ['service-1', 'service-2'],
    manufacturerData: 'data1',
  };

  const mockDevice2: SerializableDevice = {
    id: 'device-2',
    name: 'Test Device 2',
    localName: 'Test Local 2',
    isConnectable: false,
    serviceUUIDs: ['service-3'],
    manufacturerData: 'data2',
  };

  const mockWifiNetwork1: WiFiNetwork = {
    ssid: 'Network1',
    signal: -50,
    security: 'WPA2',
  };

  const mockWifiNetwork2: WiFiNetwork = {
    ssid: 'Network2',
    signal: -30,
    security: 'OPEN',
  };

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

  describe('initial state', () => {
    it('should return the initial state', () => {
      // @ts-ignore
      expect(bleReducer(undefined, { type: undefined })).toEqual(initialState);
    });

    it('should have correct initial values', () => {
      // @ts-ignore
      const state = bleReducer(undefined, { type: undefined });

      expect(state.devices).toEqual([]);
      expect(state.isScanning).toBe(false);
      expect(state.isConnected).toBe(false);
      expect(state.connectedDeviceId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.wifiStatus).toBe(WiFiStatus.WAITING);
      expect(state.wifiNetworks).toEqual([]);
      expect(state.wifiScanStatus).toBe(WiFiScanStatus.IDLE);
    });
  });

  describe('device actions', () => {
    describe('setDevices', () => {
      it('should set devices array', () => {
        const devices = [mockDevice1, mockDevice2];
        const action = setDevices(devices);
        const state = bleReducer(initialState, action);

        expect(state.devices).toEqual(devices);
        expect(state.devices).toHaveLength(2);
      });

      it('should replace existing devices', () => {
        const initialStateWithDevices = {
          ...initialState,
          devices: [mockDevice1],
        };

        const newDevices = [mockDevice2];
        const action = setDevices(newDevices);
        const state = bleReducer(initialStateWithDevices, action);

        expect(state.devices).toEqual(newDevices);
        expect(state.devices).toHaveLength(1);
        expect(state.devices[0].id).toBe('device-2');
      });

      it('should handle empty devices array', () => {
        const action = setDevices([]);
        const state = bleReducer(initialState, action);

        expect(state.devices).toEqual([]);
      });
    });

    describe('addDevice', () => {
      it('should add a new device to empty devices array', () => {
        const action = addDevice(mockDevice1);
        const state = bleReducer(initialState, action);

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(mockDevice1);
      });

      it('should add a new device to existing devices array', () => {
        const initialStateWithDevices = {
          ...initialState,
          devices: [mockDevice1],
        };

        const action = addDevice(mockDevice2);
        const state = bleReducer(initialStateWithDevices, action);

        expect(state.devices).toHaveLength(2);
        expect(state.devices).toContain(mockDevice1);
        expect(state.devices).toContain(mockDevice2);
      });

      it('should not add duplicate device (same id)', () => {
        const initialStateWithDevices = {
          ...initialState,
          devices: [mockDevice1],
        };

        const duplicateDevice = { ...mockDevice1, name: 'Different Name' };
        const action = addDevice(duplicateDevice);
        const state = bleReducer(initialStateWithDevices, action);

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(mockDevice1); // Original device preserved
        expect(state.devices[0].name).toBe('Test Device 1'); // Not updated
      });

      it('should handle adding device with null/undefined properties', () => {
        const deviceWithNulls: SerializableDevice = {
          id: 'device-null',
          name: null,
          localName: null,
          isConnectable: null,
          serviceUUIDs: null,
          manufacturerData: null,
        };

        const action = addDevice(deviceWithNulls);
        const state = bleReducer(initialState, action);

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(deviceWithNulls);
      });
    });

    describe('clearDevices', () => {
      it('should clear all devices', () => {
        const initialStateWithDevices = {
          ...initialState,
          devices: [mockDevice1, mockDevice2],
        };

        const action = clearDevices();
        const state = bleReducer(initialStateWithDevices, action);

        expect(state.devices).toEqual([]);
        expect(state.devices).toHaveLength(0);
      });

      it('should work on empty devices array', () => {
        const action = clearDevices();
        const state = bleReducer(initialState, action);

        expect(state.devices).toEqual([]);
      });
    });
  });

  describe('scanning actions', () => {
    describe('setScanning', () => {
      it('should set scanning to true', () => {
        const action = setScanning(true);
        const state = bleReducer(initialState, action);

        expect(state.isScanning).toBe(true);
      });

      it('should set scanning to false', () => {
        const scanningState = {
          ...initialState,
          isScanning: true,
        };

        const action = setScanning(false);
        const state = bleReducer(scanningState, action);

        expect(state.isScanning).toBe(false);
      });
    });
  });

  describe('connection actions', () => {
    describe('setConnected', () => {
      it('should set connected state with deviceId', () => {
        const action = setConnected({ isConnected: true, deviceId: 'device-123' });
        const state = bleReducer(initialState, action);

        expect(state.isConnected).toBe(true);
        expect(state.connectedDeviceId).toBe('device-123');
      });

      it('should set disconnected state', () => {
        const connectedState = {
          ...initialState,
          isConnected: true,
          connectedDeviceId: 'device-123',
        };

        const action = setConnected({ isConnected: false, deviceId: null });
        const state = bleReducer(connectedState, action);

        expect(state.isConnected).toBe(false);
        expect(state.connectedDeviceId).toBeNull();
      });

      it('should handle missing deviceId in payload', () => {
        const action = setConnected({ isConnected: true });
        const state = bleReducer(initialState, action);

        expect(state.isConnected).toBe(true);
        expect(state.connectedDeviceId).toBeNull();
      });

      it('should handle explicit null deviceId', () => {
        const action = setConnected({ isConnected: true, deviceId: null });
        const state = bleReducer(initialState, action);

        expect(state.isConnected).toBe(true);
        expect(state.connectedDeviceId).toBeNull();
      });
    });
  });

  describe('error actions', () => {
    describe('setError', () => {
      it('should set error message', () => {
        const errorMessage = 'Connection failed';
        const action = setError(errorMessage);
        const state = bleReducer(initialState, action);

        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null', () => {
        const stateWithError = {
          ...initialState,
          error: 'Previous error',
        };

        const action = setError(null);
        const state = bleReducer(stateWithError, action);

        expect(state.error).toBeNull();
      });

      it('should replace existing error', () => {
        const stateWithError = {
          ...initialState,
          error: 'Old error',
        };

        const action = setError('New error');
        const state = bleReducer(stateWithError, action);

        expect(state.error).toBe('New error');
      });
    });

    describe('clearError', () => {
      it('should clear error message', () => {
        const stateWithError = {
          ...initialState,
          error: 'Some error',
        };

        const action = clearError();
        const state = bleReducer(stateWithError, action);

        expect(state.error).toBeNull();
      });

      it('should work when error is already null', () => {
        const action = clearError();
        const state = bleReducer(initialState, action);

        expect(state.error).toBeNull();
      });
    });
  });

  describe('WiFi actions', () => {
    describe('setWifiStatus', () => {
      it('should set wifi status to connecting', () => {
        const action = setWifiStatus(WiFiStatus.CONNECTING);
        const state = bleReducer(initialState, action);

        expect(state.wifiStatus).toBe(WiFiStatus.CONNECTING);
      });

      it('should set wifi status to success', () => {
        const action = setWifiStatus(WiFiStatus.SUCCESS);
        const state = bleReducer(initialState, action);

        expect(state.wifiStatus).toBe(WiFiStatus.SUCCESS);
      });

      it('should set wifi status to error', () => {
        const action = setWifiStatus(WiFiStatus.ERROR);
        const state = bleReducer(initialState, action);

        expect(state.wifiStatus).toBe(WiFiStatus.ERROR);
      });
    });

    describe('setWifiNetworks', () => {
      it('should set wifi networks array', () => {
        const networks = [mockWifiNetwork1, mockWifiNetwork2];
        const action = setWifiNetworks(networks);
        const state = bleReducer(initialState, action);

        expect(state.wifiNetworks).toEqual(networks);
        expect(state.wifiNetworks).toHaveLength(2);
      });

      it('should replace existing wifi networks', () => {
        const stateWithNetworks = {
          ...initialState,
          wifiNetworks: [mockWifiNetwork1],
        };

        const newNetworks = [mockWifiNetwork2];
        const action = setWifiNetworks(newNetworks);
        const state = bleReducer(stateWithNetworks, action);

        expect(state.wifiNetworks).toEqual(newNetworks);
        expect(state.wifiNetworks).toHaveLength(1);
      });

      it('should handle empty networks array', () => {
        const action = setWifiNetworks([]);
        const state = bleReducer(initialState, action);

        expect(state.wifiNetworks).toEqual([]);
      });
    });

    describe('setWifiScanStatus', () => {
      it('should set wifi scan status to scanning', () => {
        const action = setWifiScanStatus(WiFiScanStatus.SCANNING);
        const state = bleReducer(initialState, action);

        expect(state.wifiScanStatus).toBe(WiFiScanStatus.SCANNING);
      });

      it('should set wifi scan status to completed', () => {
        const action = setWifiScanStatus(WiFiScanStatus.COMPLETED);
        const state = bleReducer(initialState, action);

        expect(state.wifiScanStatus).toBe(WiFiScanStatus.COMPLETED);
      });

      it('should set wifi scan status to error', () => {
        const action = setWifiScanStatus(WiFiScanStatus.ERROR);
        const state = bleReducer(initialState, action);

        expect(state.wifiScanStatus).toBe(WiFiScanStatus.ERROR);
      });
    });
  });

  describe('reset actions', () => {
    const stateWithData: BleState = {
      devices: [mockDevice1, mockDevice2],
      isScanning: true,
      isConnected: true,
      connectedDeviceId: 'device-123',
      error: 'Some error',
      wifiStatus: WiFiStatus.SUCCESS,
      wifiNetworks: [mockWifiNetwork1, mockWifiNetwork2],
      wifiScanStatus: WiFiScanStatus.COMPLETED,
      criticalDisconnection: false,
    };

    describe('resetBleState', () => {
      it('should reset all state to initial values', () => {
        const action = resetBleState();
        const state = bleReducer(stateWithData, action);

        expect(state).toEqual(initialState);
      });

      it('should work on already reset state', () => {
        const action = resetBleState();
        const state = bleReducer(initialState, action);

        expect(state).toEqual(initialState);
      });
    });

    describe('resetConnectionState', () => {
      it('should reset only connection-related state', () => {
        const action = resetConnectionState();
        const state = bleReducer(stateWithData, action);

        expect(state.isConnected).toBe(false);
        expect(state.connectedDeviceId).toBeNull();
        expect(state.wifiStatus).toBe(WiFiStatus.WAITING);
        expect(state.wifiNetworks).toEqual([]);
        expect(state.wifiScanStatus).toBe(WiFiScanStatus.IDLE);

        // Other state should remain unchanged
        expect(state.devices).toEqual(stateWithData.devices);
        expect(state.isScanning).toBe(stateWithData.isScanning);
        expect(state.error).toBe(stateWithData.error);
      });
    });

    describe('resetWifiState', () => {
      it('should reset only WiFi-related state', () => {
        const action = resetWifiState();
        const state = bleReducer(stateWithData, action);

        expect(state.wifiStatus).toBe(WiFiStatus.WAITING);
        expect(state.wifiNetworks).toEqual([]);
        expect(state.wifiScanStatus).toBe(WiFiScanStatus.IDLE);

        // Other state should remain unchanged
        expect(state.devices).toEqual(stateWithData.devices);
        expect(state.isScanning).toBe(stateWithData.isScanning);
        expect(state.isConnected).toBe(stateWithData.isConnected);
        expect(state.connectedDeviceId).toBe(stateWithData.connectedDeviceId);
        expect(state.error).toBe(stateWithData.error);
      });
    });
  });

  describe('constants', () => {
    describe('WiFiStatus', () => {
      it('should have correct status values', () => {
        expect(WiFiStatus.WAITING).toBe(0);
        expect(WiFiStatus.CONNECTING).toBe(1);
        expect(WiFiStatus.SUCCESS).toBe(2);
        expect(WiFiStatus.ERROR).toBe(3);
      });
    });

    describe('WiFiScanStatus', () => {
      it('should have correct scan status values', () => {
        expect(WiFiScanStatus.IDLE).toBe(0);
        expect(WiFiScanStatus.SCANNING).toBe(1);
        expect(WiFiScanStatus.COMPLETED).toBe(2);
        expect(WiFiScanStatus.ERROR).toBe(3);
      });
    });
  });

  describe('action creators', () => {
    it('should export all action creators', () => {
      expect(setDevices).toBeDefined();
      expect(addDevice).toBeDefined();
      expect(clearDevices).toBeDefined();
      expect(setScanning).toBeDefined();
      expect(setConnected).toBeDefined();
      expect(setError).toBeDefined();
      expect(clearError).toBeDefined();
      expect(setWifiStatus).toBeDefined();
      expect(setWifiNetworks).toBeDefined();
      expect(setWifiScanStatus).toBeDefined();
      expect(resetBleState).toBeDefined();
      expect(resetConnectionState).toBeDefined();
      expect(resetWifiState).toBeDefined();
    });

    it('should create actions with correct type and payload', () => {
      const action = setDevices([mockDevice1]);
      expect(action.type).toBe('ble/setDevices');
      expect(action.payload).toEqual([mockDevice1]);

      const addAction = addDevice(mockDevice2);
      expect(addAction.type).toBe('ble/addDevice');
      expect(addAction.payload).toEqual(mockDevice2);

      const scanAction = setScanning(true);
      expect(scanAction.type).toBe('ble/setScanning');
      expect(scanAction.payload).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState, devices: [mockDevice1] };
      const originalDevices = originalState.devices;

      const action = addDevice(mockDevice2);
      const newState = bleReducer(originalState, action);

      // Original state should be unchanged
      expect(originalState.devices).toBe(originalDevices);
      expect(originalState.devices).toHaveLength(1);

      // New state should have the added device
      expect(newState.devices).toHaveLength(2);
      expect(newState.devices).toContain(mockDevice1);
      expect(newState.devices).toContain(mockDevice2);
    });

    it('should return new state object', () => {
      const action = setScanning(true);
      const newState = bleReducer(initialState, action);

      expect(newState).not.toBe(initialState);
      expect(newState.isScanning).toBe(true);
      expect(initialState.isScanning).toBe(false);
    });
  });
});
