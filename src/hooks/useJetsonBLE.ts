import { useCallback, useEffect } from 'react';
import { Device } from 'react-native-ble-plx';
import { useAppSelector } from '@redux/store';
import { jetsonBLEService } from '@/services/jetsonBLEService';
import {
  SerializableDevice,
  WiFiNetwork,
  WiFiStatus,
  WiFiScanStatus,
} from '@redux/slices/bleSlice';

// =============================================================================
// RE-EXPORT TYPES AND CONSTANTS for backward compatibility
// =============================================================================

export { WiFiStatus, WiFiScanStatus };
export type { WiFiNetwork };

// =============================================================================
// HOOK
// =============================================================================

export function useJetsonBLE() {
  // Get state from Redux
  const bleState = useAppSelector((state) => state.ble);

  // Cleanup on unmount (optional - service manages its own lifecycle)
  useEffect(() => {
    return () => {
      // Note: We don't call cleanupAll here anymore because the service
      // is a singleton and should persist across component lifecycles.
      // Only call cleanup when you want to explicitly disconnect.
    };
  }, []);

  // Wrapper for connect that accepts both Device and SerializableDevice
  const connect = useCallback(async (device: Device | SerializableDevice, pinCode: string) => {
    await jetsonBLEService.connect(device, pinCode);
  }, []);

  // Return the same API as before for backward compatibility
  return {
    // State from Redux
    devices: bleState.devices,
    isScanning: bleState.isScanning,
    isConnected: bleState.isConnected,
    error: bleState.error,
    wifiStatus: bleState.wifiStatus,
    wifiNetworks: bleState.wifiNetworks,
    wifiScanStatus: bleState.wifiScanStatus,

    // Actions from service
    startScan: jetsonBLEService.startScan,
    stopScan: jetsonBLEService.stopScan,
    connect,
    disconnect: jetsonBLEService.disconnect,
    sendWiFiCredentials: jetsonBLEService.sendWiFiCredentials,
    requestWiFiScan: jetsonBLEService.requestWiFiScan,

    // Utils
    clearError: jetsonBLEService.clearError,
  };
}
