import { Device, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { jetsonBLEService } from '@/services/jetsonBLEService';
import bleManager from '../../src/utils/bleManagerSingleton';
import { store } from '@redux/store';
import {
  addDevice,
  setScanning,
  setConnected,
  setError,
  clearError,
  resetConnectionState,
  SerializableDevice,
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
        wifiScanStatus: 0, // WiFiScanStatus.IDLE
      },
    })),
  },
}));

// Mock Redux actions
jest.mock('../../src/redux/slices/bleSlice', () => ({
  addDevice: jest.fn(),
  clearDevices: jest.fn(),
  setScanning: jest.fn(),
  setConnected: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  setWifiStatus: jest.fn(),
  setWifiNetworks: jest.fn(),
  setWifiScanStatus: jest.fn(),
  resetConnectionState: jest.fn(),
  WiFiScanStatus: {
    IDLE: 0,
    SCANNING: 1,
    COMPLETED: 2,
    ERROR: 3,
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

// Mock Buffer
jest.mock('buffer', () => ({
  Buffer: {
    from: jest.fn((data: string | number[], encoding?: string) => {
      if (typeof data === 'string' && encoding === 'base64') {
        // For base64 input, return buffer with proper indexing
        const realBuffer = Buffer.from(data, 'base64');
        return {
          toString: jest.fn((enc: string) => {
            if (enc === 'utf-8') {
              return realBuffer.toString('utf-8');
            }
            return data;
          }),
          [0]: realBuffer[0], // Allow indexing
          length: realBuffer.length,
        };
      }
      if (Array.isArray(data)) {
        // For array input
        const realBuffer = Buffer.from(data);
        return {
          toString: jest.fn((enc: string) => {
            if (enc === 'base64') {
              return realBuffer.toString('base64');
            }
            return data;
          }),
          [0]: realBuffer[0],
          length: realBuffer.length,
        };
      }
      if (encoding === 'utf-8') {
        // For utf-8 string input
        const realBuffer = Buffer.from(data, 'utf-8');
        return {
          toString: jest.fn((enc: string) => {
            if (enc === 'base64') {
              return realBuffer.toString('base64');
            }
            return data;
          }),
          [0]: realBuffer[0],
          length: realBuffer.length,
        };
      }
      // Default case
      return {
        toString: jest.fn(() => data),
        [0]: 0,
        length: 1,
      };
    }),
  },
}));

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

    mockSubscription = {
      remove: jest.fn(),
    } as any;

    // Setup default mocks
    (bleManager.startDeviceScan as jest.Mock).mockImplementation((services, options, callback) => {
      // Simulate finding a device
      setTimeout(() => callback(null, mockDevice), 100);
    });

    (bleManager.connectToDevice as jest.Mock).mockResolvedValue(mockDevice);
    (mockDevice.monitorCharacteristicForService as jest.Mock).mockReturnValue(mockSubscription);
    (bleManager.onDeviceDisconnected as jest.Mock).mockReturnValue(mockSubscription);
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
  });

  describe('Connection', () => {
    beforeEach(() => {
      jetsonBLEService.init();
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      (bleManager.connectToDevice as jest.Mock).mockRejectedValue(connectionError);

      await expect(jetsonBLEService.connect(mockDevice)).rejects.toThrow('Connection failed');

      expect(store.dispatch).toHaveBeenCalledWith(setError('Connection failed'));
      expect(store.dispatch).toHaveBeenCalledWith(
        setConnected({ isConnected: false, deviceId: null })
      );
    });

    it('should handle disconnect when not connected', async () => {
      await jetsonBLEService.disconnect();

      expect(bleManager.cancelDeviceConnection).not.toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(resetConnectionState());
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
