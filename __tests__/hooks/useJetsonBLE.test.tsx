import { renderHook, act } from '@testing-library/react-native';
import { useJetsonBLE } from '../../src/hooks/useJetsonBLE';
import { useAppSelector } from '@redux/store';
import { jetsonBLEService } from '@/services/jetsonBLEService';

jest.mock('@redux/store', () => ({
  useAppSelector: jest.fn(),
}));
jest.mock('@/services/jetsonBLEService', () => ({
  jetsonBLEService: {
    startScan: jest.fn(),
    stopScan: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendWiFiCredentials: jest.fn(),
    requestWiFiScan: jest.fn(),
    clearError: jest.fn(),
    checkNetworkStatus: jest.fn(),
    netSetupConnect: jest.fn(),
  },
}));

describe('useJetsonBLE', () => {
  const mockState = {
    devices: [{ id: '1', name: 'Device 1' }],
    isScanning: false,
    isConnected: true,
    error: null,
    wifiStatus: 'connected',
    wifiNetworks: [{ ssid: 'wifi', rssi: -40 }],
    wifiScanStatus: 'done',
  };

  beforeEach(() => {
    (useAppSelector as jest.Mock).mockImplementation((fn) => fn({ ble: mockState }));
    jest.clearAllMocks();
  });

  it('returns BLE state from redux', () => {
    const { result } = renderHook(() => useJetsonBLE());
    expect(result.current.devices).toEqual(mockState.devices);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.wifiStatus).toBe('connected');
    expect(result.current.wifiNetworks).toEqual(mockState.wifiNetworks);
    expect(result.current.wifiScanStatus).toBe('done');
  });

  it('calls jetsonBLEService actions', async () => {
    const { result } = renderHook(() => useJetsonBLE());
    result.current.startScan();
    result.current.stopScan();
    result.current.disconnect();
    result.current.sendWiFiCredentials('ssid', 'pass');
    result.current.requestWiFiScan();
    result.current.clearError();
    // @ts-ignore
    result.current.checkNetworkStatus();
    // @ts-ignore
    result.current.netSetupConnect();
    expect(jetsonBLEService.startScan).toHaveBeenCalled();
    expect(jetsonBLEService.stopScan).toHaveBeenCalled();
    expect(jetsonBLEService.disconnect).toHaveBeenCalled();
    expect(jetsonBLEService.sendWiFiCredentials).toHaveBeenCalledWith('ssid', 'pass');
    expect(jetsonBLEService.requestWiFiScan).toHaveBeenCalled();
    expect(jetsonBLEService.clearError).toHaveBeenCalled();
    expect(jetsonBLEService.checkNetworkStatus).toHaveBeenCalled();
    expect(jetsonBLEService.netSetupConnect).toHaveBeenCalled();
  });

  it('calls connect wrapper', async () => {
    const { result } = renderHook(() => useJetsonBLE());
    const device = { id: '1', name: 'Device 1' };
    await act(async () => {
      // @ts-ignore
      await result.current.connect(device, '1234');
    });
    expect(jetsonBLEService.connect).toHaveBeenCalledWith(device, '1234');
  });
});
