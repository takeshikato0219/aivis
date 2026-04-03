import { Device, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { jetsonBLEService, ConnectionType, NET_TYPE } from '@/services/jetsonBLEService';
import bleManager from '../../src/utils/bleManagerSingleton';
import { store } from '@redux/store';
import {
  addDevice,
  setScanning,
  setConnected,
  setError,
  clearError,
  SerializableDevice,
  setWifiScanStatus,
  AuthStatus,
  WiFiScanStatus,
} from '@redux/slices/bleSlice';

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  Device: jest.fn(),
  Subscription: jest.fn(),
}));

// Mock BLE manager
jest.mock('../../src/utils/bleManagerSingleton', () => ({
  __esModule: true,
  default: {
    connectedDevices: jest.fn(),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
    onDeviceDisconnected: jest.fn(),
  },
}));

// Mock Redux store
jest.mock('../../src/redux/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(() => ({
      ble: {
        wifiScanStatus: 0,
        authStatus: 0,
      },
    })),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

// Mock Redux actions
jest.mock('../../src/redux/slices/bleSlice', () => ({
  addDevice: jest.fn(),
  clearDevices: jest.fn(),
  setScanning: jest.fn(),
  setConnected: jest.fn((payload) => ({ type: 'setConnected', payload })),
  setError: jest.fn((payload) => ({ type: 'setError', payload })),
  clearError: jest.fn(() => ({ type: 'clearError' })),
  setWifiStatus: jest.fn(),
  setWifiNetworks: jest.fn(),
  setWifiScanStatus: jest.fn((payload) => ({ type: 'setWifiScanStatus', payload })),
  resetConnectionState: jest.fn(() => ({ type: 'resetConnectionState' })),
  WiFiScanStatus: {
    IDLE: 0,
    SCANNING: 1,
    COMPLETED: 2,
    ERROR: 3,
  },
  AuthStatus: {
    UNAUTHENTICATED: 0,
    AUTHENTICATED: 1,
    INVALID_PIN: 2,
  },
  SerializableDevice: {},
}));

// Mock React Native
const mockPermissionsAndroid = {
  PERMISSIONS: {
    BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
    BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  },
  requestMultiple: jest.fn(),
  request: jest.fn(),
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
};

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 31,
  },
  PermissionsAndroid: mockPermissionsAndroid,
}));

// Use real Buffer so stringToBase64 / base64 helpers in jetsonBLEService work
jest.mock('buffer', () => jest.requireActual('buffer'));

describe('JetsonBLEService', () => {
  let mockDevice: Device;
  let mockSerializableDevice: SerializableDevice;
  let mockSubscription: Subscription;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state before each test
    (jetsonBLEService as any).connectedDevice = null;
    (jetsonBLEService as any).subscriptions = [];
    (jetsonBLEService as any).initialized = false;
    (jetsonBLEService as any).scanTimeout = null;
    (jetsonBLEService as any).wifiScanTimeout = null;
    (jetsonBLEService as any).netCheckTimeout = null;
    (jetsonBLEService as any).isConnected = false;
    (jetsonBLEService as any).isDisconnecting = false;
    (jetsonBLEService as any).isCleaningUp = false;

    (store.getState as jest.Mock).mockReturnValue({
      ble: { wifiScanStatus: 0, authStatus: AuthStatus.UNAUTHENTICATED },
    });
    (store.subscribe as jest.Mock).mockImplementation(() => jest.fn());

    mockSubscription = {
      remove: jest.fn(),
    } as any;

    // Create mock device
    mockDevice = {
      id: 'test-device-id',
      name: 'Test Jetson',
      localName: 'Jetson BLE',
      isConnectable: true,
      serviceUUIDs: ['12345678-1234-5678-1234-56789abcdef0'],
      manufacturerData: 'test-data',
      readCharacteristicForService: jest.fn(),
      writeCharacteristicWithResponseForService: jest.fn().mockResolvedValue({}),
      writeCharacteristicWithoutResponseForService: jest.fn().mockResolvedValue({}),
      monitorCharacteristicForService: jest.fn().mockReturnValue(mockSubscription),
      discoverAllServicesAndCharacteristics: jest.fn().mockResolvedValue(mockDevice),
    } as any;

    mockSerializableDevice = {
      id: 'test-device-id',
      name: 'Test Jetson',
      localName: 'Jetson BLE',
      isConnectable: true,
      serviceUUIDs: ['12345678-1234-5678-1234-56789abcdef0'],
      manufacturerData: 'test-data',
    };

    // Setup default mocks
    (bleManager.startDeviceScan as jest.Mock).mockImplementation((services, options, callback) => {
      // Simulate finding a device
      setTimeout(() => callback(null, mockDevice), 100);
    });

    (bleManager.connectToDevice as jest.Mock).mockResolvedValue(mockDevice);
    (mockDevice.monitorCharacteristicForService as jest.Mock).mockReturnValue(mockSubscription);
    (bleManager.onDeviceDisconnected as jest.Mock).mockReturnValue(mockSubscription);

    mockPermissionsAndroid.requestMultiple.mockResolvedValue({
      'android.permission.BLUETOOTH_SCAN': 'granted',
      'android.permission.BLUETOOTH_CONNECT': 'granted',
      'android.permission.ACCESS_FINE_LOCATION': 'granted',
    });
    mockPermissionsAndroid.request.mockResolvedValue('granted');
    (Platform as any).OS = 'android';
    (Platform as any).Version = 31;
  });

  afterEach(() => {
    const svc = jetsonBLEService as any;
    if (svc.netCheckTimeout) clearTimeout(svc.netCheckTimeout);
    if (svc.wifiScanTimeout) clearTimeout(svc.wifiScanTimeout);
    if (svc.scanTimeout) clearTimeout(svc.scanTimeout);
    svc.netCheckTimeout = null;
    svc.wifiScanTimeout = null;
    svc.scanTimeout = null;
  });

  describe('Initialization', () => {
    it('should initialize the service', () => {
      jetsonBLEService.init();

      expect(jetsonBLEService.isInitialized()).toBe(true);
    });

    it('should not reinitialize if already initialized', () => {
      jetsonBLEService.init();
      expect(jetsonBLEService.isInitialized()).toBe(true);

      // Second call should not change anything
      jetsonBLEService.init();
      expect(jetsonBLEService.isInitialized()).toBe(true);
    });

    it('should check for existing connections on init', async () => {
      const mockConnectedDevices = [mockDevice];
      (bleManager.connectedDevices as jest.Mock).mockResolvedValue(mockConnectedDevices);
      (mockDevice.readCharacteristicForService as jest.Mock).mockResolvedValue({
        value: 'Mg==', // base64 for byte value 2 (SUCCESS status)
      });

      // Mock the setupSubscriptions method to avoid complex mocking
      const setupSubscriptionsSpy = jest
        .spyOn(jetsonBLEService as any, 'setupSubscriptions')
        // @ts-ignore
        .mockResolvedValue();

      jetsonBLEService.init();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(bleManager.connectedDevices).toHaveBeenCalledWith([
        '12345678-1234-5678-1234-56789abcdef0',
      ]);
      expect(store.dispatch).toHaveBeenCalledWith(
        setConnected({ isConnected: true, deviceId: mockDevice.id })
      );

      setupSubscriptionsSpy.mockRestore();
    });

    it('should handle existing connection check errors gracefully', async () => {
      (bleManager.connectedDevices as jest.Mock).mockRejectedValue(new Error('BLE error'));

      jetsonBLEService.init();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not crash, just log warning
      expect(jetsonBLEService.isInitialized()).toBe(true);
    });
  });

  describe('Permissions', () => {
    it('should return true for non-Android platforms', async () => {
      (Platform as any).OS = 'ios';

      const result = await (jetsonBLEService as any).requestAndroidPermissions();

      expect(result).toBe(true);
      expect(mockPermissionsAndroid.requestMultiple).not.toHaveBeenCalled();
    });
  });

  describe('Scanning', () => {
    beforeEach(() => {
      jetsonBLEService.init();
    });

    it('should handle scan errors', async () => {
      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': 'granted',
        'android.permission.BLUETOOTH_CONNECT': 'granted',
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
      });

      (bleManager.startDeviceScan as jest.Mock).mockImplementation(
        (services, options, callback) => {
          callback(new Error('Scan failed'), null);
        }
      );

      await jetsonBLEService.startScan();

      expect(store.dispatch).toHaveBeenCalledWith(setError('Scan failed'));
      expect(store.dispatch).toHaveBeenCalledWith(setScanning(false));
    });

    it('should add discovered devices to store', async () => {
      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': 'granted',
        'android.permission.BLUETOOTH_CONNECT': 'granted',
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
      });

      await jetsonBLEService.startScan();

      // Wait for device discovery callback
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(store.dispatch).toHaveBeenCalledWith(addDevice(mockSerializableDevice));
    });

    it('should stop scanning', () => {
      jetsonBLEService.stopScan();

      expect(bleManager.stopDeviceScan).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(setScanning(false));
    });

    it('should dispatch error when Bluetooth permissions are not granted', async () => {
      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': 'denied',
        'android.permission.BLUETOOTH_CONNECT': 'granted',
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
      });

      await jetsonBLEService.startScan();

      expect(store.dispatch).toHaveBeenCalledWith(setError('Bluetooth permissions not granted'));
      expect(store.dispatch).toHaveBeenCalledWith(setScanning(false));
    });
  });

  describe('Connection', () => {
    beforeEach(() => {
      jetsonBLEService.init();
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      (bleManager.connectToDevice as jest.Mock).mockRejectedValue(connectionError);

      // @ts-ignore
      const result = await jetsonBLEService.connect(mockDevice);
      expect(result).toEqual({ success: false });
    });

    it('should handle disconnect when not connected', async () => {
      await jetsonBLEService.disconnect();
      expect(bleManager.cancelDeviceConnection).not.toHaveBeenCalled();
    });

    it('should return success immediately when already connected', async () => {
      (jetsonBLEService as any).isConnected = true;

      const result = await jetsonBLEService.connect(mockDevice, '1234');

      expect(result).toEqual({ success: true });
      expect(bleManager.connectToDevice).not.toHaveBeenCalled();
    });

    it('should complete connect when PIN auth succeeds', async () => {
      let subscribeListener: () => void;
      (store.subscribe as jest.Mock).mockImplementation((cb: () => void) => {
        subscribeListener = cb;
        return jest.fn();
      });
      (mockDevice.writeCharacteristicWithResponseForService as jest.Mock).mockImplementation(
        async () => {
          (store.getState as jest.Mock).mockReturnValue({
            ble: { wifiScanStatus: 0, authStatus: AuthStatus.AUTHENTICATED },
          });
          subscribeListener();
        }
      );

      const result = await jetsonBLEService.connect(mockDevice, '1234');

      expect(result).toEqual({ success: true });
      expect(mockDevice.writeCharacteristicWithResponseForService).toHaveBeenCalled();
    });

    it('should return INVALID_PIN when auth state is invalid PIN', async () => {
      let subscribeListener: () => void;
      (store.subscribe as jest.Mock).mockImplementation((cb: () => void) => {
        subscribeListener = cb;
        return jest.fn();
      });
      (mockDevice.writeCharacteristicWithResponseForService as jest.Mock).mockImplementation(
        async () => {
          (store.getState as jest.Mock).mockReturnValue({
            ble: { wifiScanStatus: 0, authStatus: AuthStatus.INVALID_PIN },
          });
          subscribeListener();
        }
      );

      const result = await jetsonBLEService.connect(mockDevice, '0000');

      expect(result).toEqual({ success: false, reason: 'INVALID_PIN' });
    });

    it('should cancel connection when connected and disconnect is called', async () => {
      (jetsonBLEService as any).isConnected = true;
      (jetsonBLEService as any).connectedDevice = mockDevice;

      await jetsonBLEService.disconnect();

      expect(bleManager.cancelDeviceConnection).toHaveBeenCalledWith(mockDevice.id);
    });
  });

  describe('WiFi Operations', () => {
    it('should return false when not connected', async () => {
      const result = await jetsonBLEService.sendWiFiCredentials('MyWiFi', 'password123');

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('Not connected to the device'));
    });

    it('should return false when requesting scan while not connected', async () => {
      const result = await jetsonBLEService.requestWiFiScan();

      expect(result).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('Not connected to the device'));
    });

    it('should write SSID and password when connected', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;

      const ok = await jetsonBLEService.sendWiFiCredentials('SSID-X', 'secret');

      expect(ok).toBe(true);
      expect(mockDevice.writeCharacteristicWithResponseForService).toHaveBeenCalledTimes(2);
    });

    it('should dispatch error when WiFi credential write fails', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;
      (mockDevice.writeCharacteristicWithResponseForService as jest.Mock).mockRejectedValueOnce(
        new Error('write failed')
      );

      const ok = await jetsonBLEService.sendWiFiCredentials('SSID-X', 'secret');

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('write failed'));
    });

    it('should request WiFi scan when connected', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;

      const ok = await jetsonBLEService.requestWiFiScan();

      expect(ok).toBe(true);
      expect(setWifiScanStatus).toHaveBeenCalledWith(WiFiScanStatus.SCANNING);
      expect(mockDevice.writeCharacteristicWithResponseForService).toHaveBeenCalled();
    });

    it('should return false when WiFi scan write fails', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;
      (mockDevice.writeCharacteristicWithResponseForService as jest.Mock).mockRejectedValueOnce(
        new Error('scan write error')
      );

      const ok = await jetsonBLEService.requestWiFiScan();

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('scan write error'));
    });
  });

  describe('checkNetworkStatus', () => {
    it('should return false when not connected', async () => {
      const ok = await jetsonBLEService.checkNetworkStatus('LAN');

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('Not connected to the device'));
    });

    it('should write net check (NET_TYPE byte, base64) without response and return true when connected', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;

      const ok = await jetsonBLEService.checkNetworkStatus('LTE');

      const expectedPayload = Buffer.from([NET_TYPE.LTE]).toString('base64');
      expect(ok).toBe(true);
      expect(mockDevice.writeCharacteristicWithoutResponseForService).toHaveBeenCalledWith(
        '12345678-1234-5678-1234-56789abcdef0',
        '12345678-1234-5678-1234-56789abcdef8',
        expectedPayload
      );
    });

    it('should dispatch error when net check write fails', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;
      (mockDevice.writeCharacteristicWithoutResponseForService as jest.Mock).mockRejectedValueOnce(
        new Error('net fail')
      );

      const ok = await jetsonBLEService.checkNetworkStatus('WIFI');

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('net fail'));
    });
  });

  describe('netSetupConnect', () => {
    it('should return false when not connected', async () => {
      const ok = await jetsonBLEService.netSetupConnect('lan');

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('Not connected to the device'));
    });

    it('should write UTF-8 mode as base64 to NET_SETUP_CHAR with response', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;

      const ok = await jetsonBLEService.netSetupConnect('lte');

      const expectedPayload = Buffer.from('lte', 'utf-8').toString('base64');
      expect(ok).toBe(true);
      expect(mockDevice.writeCharacteristicWithResponseForService).toHaveBeenCalledWith(
        '12345678-1234-5678-1234-56789abcdef0',
        '12345678-1234-5678-1234-56789abcdefa',
        expectedPayload
      );
    });

    it('should dispatch error when net setup write fails', async () => {
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).isConnected = true;
      (mockDevice.writeCharacteristicWithResponseForService as jest.Mock).mockRejectedValueOnce(
        new Error('setup fail')
      );

      const ok = await jetsonBLEService.netSetupConnect('lan');

      expect(ok).toBe(false);
      expect(store.dispatch).toHaveBeenCalledWith(setError('setup fail'));
    });
  });

  describe('getConnectionTypeText', () => {
    it('returns Vietnamese label for known connection types', () => {
      expect(jetsonBLEService.getConnectionTypeText(ConnectionType.WIFI)).toBe('WiFi');
      expect(jetsonBLEService.getConnectionTypeText(ConnectionType.ETHERNET)).toBe(
        'Ethernet (LAN)'
      );
    });

    it('falls back to NONE label for unknown type', () => {
      expect(jetsonBLEService.getConnectionTypeText('unknown' as any)).toBe('Không có kết nối');
    });
  });

  describe('Utility Methods', () => {
    it('should clear error', () => {
      jetsonBLEService.clearError();

      expect(store.dispatch).toHaveBeenCalledWith(clearError());
    });

    it('should return null when no device connected', () => {
      const connectedDevice = jetsonBLEService.getConnectedDevice();

      expect(connectedDevice).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      // Setup some state first
      (jetsonBLEService as any).subscriptions = [mockSubscription];
      (jetsonBLEService as any).connectedDevice = mockDevice;
      (jetsonBLEService as any).scanTimeout = setTimeout(() => {}, 1000);
      (jetsonBLEService as any).wifiScanTimeout = setTimeout(() => {}, 1000);

      jetsonBLEService.cleanupAll();

      expect(mockSubscription.remove).toHaveBeenCalled();
      expect(bleManager.stopDeviceScan).toHaveBeenCalled();
      expect(bleManager.cancelDeviceConnection).toHaveBeenCalledWith(mockDevice.id);
    });
  });

  describe('Base64 Helpers', () => {
    // These are private functions, but we can test them through the public API
    // or by accessing them directly for testing purposes

    it('should encode and decode strings correctly', () => {
      const testString = 'Hello World';
      const encoded = Buffer.from(testString, 'utf-8').toString('base64');
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

      expect(decoded).toBe(testString);
    });

    it('should encode and decode bytes correctly', () => {
      const testByte = 42;
      const encoded = Buffer.from([testByte]).toString('base64');
      const decoded = Buffer.from(encoded, 'base64')[0];

      expect(decoded).toBe(testByte);
    });
  });
});
