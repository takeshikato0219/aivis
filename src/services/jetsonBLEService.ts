import { Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import bleManager from '@utils/bleManagerSingleton';
import { store } from '@redux/store';
import {
  addDevice,
  clearDevices,
  setScanning,
  setConnected,
  setError,
  clearError,
  setWifiStatus,
  setWifiNetworks,
  setWifiScanStatus,
  resetConnectionState,
  setCriticalDisconnection,
  WiFiScanStatus,
  setAuthStatus,
  setIsAuthenticated,
  SerializableDevice,
  AuthStatus,
} from '@redux/slices/bleSlice';
import { Platform, PermissionsAndroid } from 'react-native';

// =============================================================================
// UUIDs — must match config.py on Jetson
// =============================================================================

const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const SSID_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1';
const PWD_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2';
const STATUS_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef3';
const WIFI_SCAN_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef4';
const WIFI_LIST_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef5';
const AUTH_STATUS_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef7';
const PIN_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef6';
const NET_CHECK_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef8';
const NET_STATUS_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef9';

// =============================================================================
// CONNECTION TYPE
// =============================================================================

export const ConnectionType = {
  NONE: 'none',
  WIFI: 'wifi',
  ETHERNET: 'ethernet',
  CELLULAR: 'cellular',
} as const;

export type ConnectionTypeValue = (typeof ConnectionType)[keyof typeof ConnectionType];

export const ConnectionTypeText: Record<ConnectionTypeValue, string> = {
  [ConnectionType.NONE]: 'Không có kết nối',
  [ConnectionType.WIFI]: 'WiFi',
  [ConnectionType.ETHERNET]: 'Ethernet (LAN)',
  [ConnectionType.CELLULAR]: 'Di động (LTE/4G)',
};

// =============================================================================
// BASE64 HELPERS
// =============================================================================

const stringToBase64 = (str: string): string => Buffer.from(str, 'utf-8').toString('base64');
const base64ToString = (base64: string): string => Buffer.from(base64, 'base64').toString('utf-8');
const byteToBase64 = (byte: number): string => Buffer.from([byte]).toString('base64');
const base64ToByte = (base64: string): number => Buffer.from(base64, 'base64')[0];

// =============================================================================
// HELPER: Convert Device to SerializableDevice
// =============================================================================

const toSerializableDevice = (device: Device): SerializableDevice => ({
  id: device.id,
  name: device.name,
  localName: device.localName,
  isConnectable: device.isConnectable,
  serviceUUIDs: device.serviceUUIDs,
  manufacturerData: device.manufacturerData,
});

// =============================================================================
// CONSTANTS
// =============================================================================

const SCAN_TIMEOUT_MS = 10000;

// =============================================================================
// BLE SERVICE SINGLETON
// =============================================================================

class JetsonBLEService {
  private connectedDevice: Device | null = null;
  private subscriptions: Subscription[] = [];
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private wifiScanTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialized: boolean = false;

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Initialize the service. Should be called once at app startup.
   */
  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // Check for existing connection on init
    this.checkExistingConnection();
  }

  /**
   * Check if there's an existing BLE connection from a previous session
   */
  private async checkExistingConnection(): Promise<void> {
    try {
      const connectedDevices = await bleManager.connectedDevices([SERVICE_UUID]);

      if (connectedDevices.length > 0) {
        const device = connectedDevices[0];

        // Test if device is actually connected
        try {
          await device.readCharacteristicForService(SERVICE_UUID, STATUS_CHAR_UUID);

          this.connectedDevice = device;
          store.dispatch(setConnected({ isConnected: true, deviceId: device.id }));

          // Set up subscriptions for existing connection
          await this.setupSubscriptions(device);

          // Read initial status
          const statusChar = await device.readCharacteristicForService(
            SERVICE_UUID,
            STATUS_CHAR_UUID
          );
          if (statusChar.value) {
            store.dispatch(setWifiStatus(base64ToByte(statusChar.value)));
          }
        } catch (connectivityError) {
          console.log('❌ Device not responsive:', connectivityError);
        }
      }
    } catch (error) {
      console.warn('Failed to check existing BLE connections:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS SETUP
  // ---------------------------------------------------------------------------

  private async setupSubscriptions(device: Device): Promise<void> {
    // Subscribe Status notifications
    const statusSub = device.monitorCharacteristicForService(
      SERVICE_UUID,
      STATUS_CHAR_UUID,
      (monitorError, characteristic) => {
        if (monitorError) {
          if (!monitorError.message?.includes('cancelled')) {
            console.error('[BLE] Status subscription error:', monitorError);
            store.dispatch(setConnected({ isConnected: false, deviceId: null }));
            // Cleanup subscriptions on critical error
            if (
              monitorError.message?.includes('disconnected') ||
              monitorError.message?.includes('connection lost')
            ) {
              this.cleanupSubscriptions();
              this.connectedDevice = null;
              store.dispatch(setCriticalDisconnection(true));
            }
          }
          return;
        }
        if (characteristic?.value) {
          store.dispatch(setWifiStatus(base64ToByte(characteristic.value)));
        }
      }
    );
    this.subscriptions.push(statusSub);

    // Subscribe WiFiList notifications
    const wifiListSub = device.monitorCharacteristicForService(
      SERVICE_UUID,
      WIFI_LIST_CHAR_UUID,
      (monitorError, characteristic) => {
        if (monitorError) {
          if (!monitorError.message?.includes('cancelled')) {
            console.error('[BLE] WiFi list subscription error:', monitorError);
            // Cleanup subscriptions on critical error
            if (
              monitorError.message?.includes('disconnected') ||
              monitorError.message?.includes('connection lost')
            ) {
              this.cleanupSubscriptions();
              this.connectedDevice = null;
              store.dispatch(setCriticalDisconnection(true));
            }
          }
          return;
        }
        if (characteristic?.value) {
          try {
            const jsonStr = base64ToString(characteristic.value);
            console.log('jsonStr', jsonStr);
            const data = JSON.parse(jsonStr);
            store.dispatch(setWifiScanStatus(data.status));
            store.dispatch(setWifiNetworks(data.networks || []));

            // Clear timeout since we received response
            if (this.wifiScanTimeout) {
              clearTimeout(this.wifiScanTimeout);
              this.wifiScanTimeout = null;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (parseError) {
            store.dispatch(setError('WiFi list parsing error'));
            // Clear timeout on error too
            if (this.wifiScanTimeout) {
              clearTimeout(this.wifiScanTimeout);
              this.wifiScanTimeout = null;
            }
          }
        }
      }
    );
    this.subscriptions.push(wifiListSub);

    // Set up disconnect listener
    const disconnectSub = bleManager.onDeviceDisconnected(device.id, () => {
      console.log('[BLE] Device disconnected unexpectedly, cleaning up subscriptions...');
      // Cleanup subscriptions when device disconnects unexpectedly
      this.cleanupSubscriptions();
      store.dispatch(resetConnectionState());
      this.connectedDevice = null;
      // Trigger critical disconnection alert
      store.dispatch(setCriticalDisconnection(true));
    });
    this.subscriptions.push(disconnectSub);
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];
  }

  private cleanupScanTimeout(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  private cleanupWifiScanTimeout(): void {
    if (this.wifiScanTimeout) {
      clearTimeout(this.wifiScanTimeout);
      this.wifiScanTimeout = null;
    }
  }

  cleanupAll(): void {
    this.cleanupSubscriptions();
    this.cleanupScanTimeout();
    this.cleanupWifiScanTimeout();
    bleManager.stopDeviceScan();

    if (this.connectedDevice) {
      bleManager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          result['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          result['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      } else {
        // Android 11 and below
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === 'granted';
      }
    } catch (error) {
      console.error('[BLE] Permission request error:', error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // SCAN
  // ---------------------------------------------------------------------------

  startScan = async (): Promise<void> => {
    const hasPermission = await this.requestAndroidPermissions();
    if (!hasPermission) {
      store.dispatch(setError('Bluetooth permissions not granted'));
      store.dispatch(setScanning(false));
      return;
    }

    store.dispatch(clearDevices());
    store.dispatch(clearError());
    store.dispatch(setScanning(true));

    bleManager.stopDeviceScan();

    // Filter by SERVICE_UUID at BLE stack level
    bleManager.startDeviceScan([SERVICE_UUID], { allowDuplicates: false }, (scanError, device) => {
      if (scanError) {
        store.dispatch(setError(scanError.message));
        store.dispatch(setScanning(false));
        return;
      }

      if (device) {
        store.dispatch(addDevice(toSerializableDevice(device)));
      }
    });

    // Auto-stop after SCAN_TIMEOUT_MS
    this.scanTimeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      store.dispatch(setScanning(false));
    }, SCAN_TIMEOUT_MS);
  };

  stopScan = (): void => {
    bleManager.stopDeviceScan();
    store.dispatch(setScanning(false));
    this.cleanupScanTimeout();
  };

  // ---------------------------------------------------------------------------
  // CONNECT
  // ---------------------------------------------------------------------------

  connect = async (device: Device | SerializableDevice, pinCode: string): Promise<void> => {
    try {
      store.dispatch(clearError());

      // 1. Connect to device
      let connectedDevice = await bleManager.connectToDevice(device.id);

      // 2. Discover all services + characteristics
      connectedDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connectedDevice;

      // 3. Setup subscriptions
      await this.setupSubscriptions(connectedDevice);

      // 4. Authenticate with PIN (if supported)
      try {
        // Subscribe to auth status notifications
        const authStatusSub = connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          AUTH_STATUS_CHAR_UUID,
          (monitorError: any, characteristic: any) => {
            if (monitorError) {
              console.error('[BLE] Auth status monitor error:', monitorError.message);
              return;
            }
            if (characteristic?.value) {
              const status = base64ToByte(characteristic.value);
              console.log(`[BLE] Auth status notification: ${status}`);
              setAuthStatus(status);
            }
          }
        );
        this.subscriptions.push(authStatusSub);

        // Send your PIN and wait for the results.
        const authResult = await new Promise<number>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('PIN verification timeout has ended.'));
          }, 5000);

          // Subscribe temporarily to receive authentication results.
          const tempSub = connectedDevice.monitorCharacteristicForService(
            SERVICE_UUID,
            AUTH_STATUS_CHAR_UUID,
            (monitorError: any, characteristic: any) => {
              if (monitorError) {
                clearTimeout(timeout);
                tempSub.remove();
                reject(monitorError);
                return;
              }
              if (characteristic?.value) {
                const status = base64ToByte(characteristic.value);
                clearTimeout(timeout);
                tempSub.remove();
                resolve(status);
              }
            }
          );
          pinCode = '123456';
          // Send PIN
          connectedDevice
            .writeCharacteristicWithResponseForService(
              SERVICE_UUID,
              PIN_CHAR_UUID,
              stringToBase64(pinCode)
            )
            .catch((err: any) => {
              clearTimeout(timeout);
              tempSub.remove();
              reject(err);
            });
        });

        if (authResult === AuthStatus.AUTHENTICATED) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setIsAuthenticated(true);
        } else {
          // PIN sai → disconnect
          setAuthStatus(AuthStatus.INVALID_PIN);
          setIsAuthenticated(false);
          await bleManager.cancelDeviceConnection(connectedDevice.id);
          setError('Incorrect PIN');
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (authErr: any) {
        setIsAuthenticated(true);
        setAuthStatus(AuthStatus.AUTHENTICATED);
      }

      // 5. Read initial status
      const statusChar = await connectedDevice.readCharacteristicForService(
        SERVICE_UUID,
        STATUS_CHAR_UUID
      );
      if (statusChar.value) {
        store.dispatch(setWifiStatus(base64ToByte(statusChar.value)));
      }

      // 6. Update connected state
      store.dispatch(setConnected({ isConnected: true, deviceId: connectedDevice.id }));
    } catch (err: any) {
      // Cleanup subscriptions on connection error
      this.cleanupSubscriptions();
      store.dispatch(setError(err?.message || 'Connection error'));
      store.dispatch(setConnected({ isConnected: false, deviceId: null }));
      throw err;
    }
  };

  // ---------------------------------------------------------------------------
  // DISCONNECT
  // ---------------------------------------------------------------------------

  disconnect = async (): Promise<void> => {
    // Remove all subscriptions first
    this.cleanupSubscriptions();

    // Cancel connection
    if (this.connectedDevice) {
      await bleManager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
    }
    this.connectedDevice = null;
    // Reset state
    store.dispatch(resetConnectionState());
  };

  // ---------------------------------------------------------------------------
  // SEND WIFI CREDENTIALS
  // ---------------------------------------------------------------------------

  sendWiFiCredentials = async (ssid: string, password: string): Promise<boolean> => {
    if (!this.connectedDevice) {
      store.dispatch(setError('Not connected to the device'));
      return false;
    }

    try {
      store.dispatch(clearError());

      // Write SSID
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SSID_CHAR_UUID,
        stringToBase64(ssid)
      );

      // Write Password → Jetson receives SSID + Password → auto connects to Wi-Fi
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PWD_CHAR_UUID,
        stringToBase64(password)
      );

      return true;
    } catch (err: any) {
      store.dispatch(setError(err?.message || 'WiFi information transmission error'));
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // REQUEST WIFI SCAN
  // ---------------------------------------------------------------------------

  requestWiFiScan = async (): Promise<boolean> => {
    if (!this.connectedDevice) {
      store.dispatch(setError('Not connected to the device'));
      return false;
    }

    try {
      // Clear any existing timeout
      this.cleanupWifiScanTimeout();

      store.dispatch(clearError());
      store.dispatch(setWifiScanStatus(WiFiScanStatus.SCANNING));

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        WIFI_SCAN_CHAR_UUID,
        byteToBase64(1)
      );

      // Set timeout to reset status if no response after 30 seconds
      this.wifiScanTimeout = setTimeout(() => {
        const currentStatus = store.getState().ble.wifiScanStatus;
        // Only reset if still scanning (device didn't respond)
        if (currentStatus === WiFiScanStatus.SCANNING) {
          store.dispatch(setWifiScanStatus(WiFiScanStatus.ERROR));
          store.dispatch(setError('WiFi scan timeout - no response from device'));
        }
        this.wifiScanTimeout = null;
      }, 30000); // 30 seconds timeout

      return true;
    } catch (err: any) {
      this.cleanupWifiScanTimeout();
      store.dispatch(setError(err?.message || 'WiFi scan required error'));
      store.dispatch(setWifiScanStatus(WiFiScanStatus.ERROR));
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // UTILITY
  // ---------------------------------------------------------------------------

  clearError = (): void => {
    store.dispatch(clearError());
  };

  /**
   * Get the currently connected device (if any)
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ---------------------------------------------------------------------------
  // CHECK NETWORK STATUS
  // ---------------------------------------------------------------------------

  /**
   * Request network connection status from Jetson device.
   * Writes to NET_CHECK_CHAR_UUID and monitors NET_STATUS_CHAR_UUID for response.
   * @returns Promise with ConnectionTypeValue or null if failed
   */
  checkNetworkStatus = async (): Promise<ConnectionTypeValue | null> => {
    if (!this.connectedDevice) {
      store.dispatch(setError('Not connected to the device'));
      return null;
    }

    try {
      store.dispatch(clearError());

      // Create a promise that will resolve when we receive the status
      const statusPromise = new Promise<ConnectionTypeValue>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Network status check timeout'));
        }, 10000); // 10 seconds timeout

        // Subscribe to NET_STATUS_CHAR_UUID to receive the response
        const statusSub = this.connectedDevice!.monitorCharacteristicForService(
          SERVICE_UUID,
          NET_STATUS_CHAR_UUID,
          (monitorError, characteristic) => {
            if (monitorError) {
              clearTimeout(timeout);
              statusSub.remove();
              reject(monitorError);
              return;
            }

            if (characteristic?.value) {
              clearTimeout(timeout);
              statusSub.remove();

              const statusStr = base64ToString(characteristic.value);
              console.log('[BLE] Network status received:', statusStr);

              // Parse the status and return ConnectionType
              if (
                statusStr === ConnectionType.WIFI ||
                statusStr === ConnectionType.ETHERNET ||
                statusStr === ConnectionType.CELLULAR ||
                statusStr === ConnectionType.NONE
              ) {
                resolve(statusStr as ConnectionTypeValue);
              } else {
                // Try to parse as JSON if it's a more complex response
                try {
                  const data = JSON.parse(statusStr);
                  resolve((data.type || ConnectionType.NONE) as ConnectionTypeValue);
                } catch {
                  resolve(ConnectionType.NONE);
                }
              }
            }
          }
        );

        // Add subscription to clean up list
        this.subscriptions.push(statusSub);
      });

      // Write to NET_CHECK_CHAR_UUID to trigger the check (send 1 to request status)
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        NET_CHECK_CHAR_UUID,
        byteToBase64(1)
      );

      // Wait for the status response and return
      return await statusPromise;
    } catch (err: any) {
      console.error('[BLE] Network status check error:', err);
      store.dispatch(setError(err?.message || 'Network status check error'));
      return null;
    }
  };

  /**
   * Get connection type text for display
   */
  getConnectionTypeText = (type: ConnectionTypeValue): string => {
    return ConnectionTypeText[type] || ConnectionTypeText[ConnectionType.NONE];
  };
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const jetsonBLEService = new JetsonBLEService();
