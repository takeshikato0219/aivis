// Mock react-native-ble-plx before any imports
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
    connectedDevices: jest.fn(),
    onDeviceDisconnected: jest.fn(),
  })),
}));

describe('bleManagerSingleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a BleManager instance', () => {
    // Import the singleton
    const bleManager = require('../../src/utils/bleManagerSingleton').default;

    expect(bleManager).toBeDefined();
    expect(typeof bleManager).toBe('object');
  });

  it('should return the same instance on multiple imports', () => {
    // Import multiple times
    const bleManager1 = require('../../src/utils/bleManagerSingleton').default;
    const bleManager2 = require('../../src/utils/bleManagerSingleton').default;

    // Should be the same instance (singleton pattern)
    expect(bleManager1).toBe(bleManager2);
  });

  it('should have BleManager methods', () => {
    const bleManager = require('../../src/utils/bleManagerSingleton').default;

    // Check that it has methods that a BleManager instance should have
    expect(typeof bleManager.startDeviceScan).toBe('function');
    expect(typeof bleManager.stopDeviceScan).toBe('function');
    expect(typeof bleManager.connectToDevice).toBe('function');
    expect(typeof bleManager.cancelDeviceConnection).toBe('function');
    expect(typeof bleManager.connectedDevices).toBe('function');
    expect(typeof bleManager.onDeviceDisconnected).toBe('function');
  });

  it('should be a singleton (same reference)', () => {
    const bleManager1 = require('../../src/utils/bleManagerSingleton').default;

    // Delete from require cache and re-require
    delete require.cache[require.resolve('../../src/utils/bleManagerSingleton')];
    const bleManager2 = require('../../src/utils/bleManagerSingleton').default;

    // Should still be the same instance due to module caching
    expect(bleManager1).toBe(bleManager2);
  });
});