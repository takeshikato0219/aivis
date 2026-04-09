import { Device, Subscription, BleErrorCode } from 'react-native-ble-plx';
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
  WiFiScanStatus,
  WiFiStatus,
  setAuthStatus,
  setIsAuthenticated,
  SerializableDevice,
  AuthStatus,
  setNetworkStatus,
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
const NET_SETUP_CHAR_UUID = '12345678-1234-5678-1234-56789abcdefa';
const NET_SETUP_STATUS_CHAR_UUID = '12345678-1234-5678-1234-56789abcdefb';

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

export const NET_TYPE = { LTE: 1, WIFI: 2, LAN: 3 } as const;

export type NetCheckType = keyof typeof NET_TYPE;

export type NetSetupMode = 'lan' | 'lte';

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
  private netCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  private netSetupTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private isDisconnecting = false;
  private isCleaningUp = false;

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
      console.log('Failed to check existing BLE connections:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS SETUP
  // ---------------------------------------------------------------------------

  private async setupSubscriptions(device: Device): Promise<void> {
    const safeMonitor = (charUUID: string, handler: (value: string) => void): Subscription => {
      // Do NOT pass a custom transactionId here. Using a custom transactionId
      // and then calling both cancelTransaction() + sub.remove() fires the
      // error callback twice — the second time with a null error code, which
      // causes a NullPointerException in PromiseImpl.reject on Android.
      // Instead, we let the library manage the transactionId internally and
      // ONLY call sub.remove() during cleanup, which cancels internally once.
      return device.monitorCharacteristicForService(
        SERVICE_UUID,
        charUUID,
        (error, characteristic) => {
          if (error) {
            // BleErrorCode.OperationCancelled (2) is fired when sub.remove() is
            // called — this is expected and MUST be swallowed silently.
            if (
              error.errorCode === BleErrorCode.OperationCancelled ||
              error.errorCode == null ||
              error.message?.toLowerCase().includes('cancel')
            ) {
              return;
            }
            const errorMsg = error?.message ?? 'Unknown BLE monitor error';
            console.log('[BLE] Monitor error:', errorMsg);
            return;
          }

          if (characteristic?.value) {
            handler(characteristic.value);
          }
        }
      );
    };

    this.subscriptions.push(
      safeMonitor(STATUS_CHAR_UUID, (value) => {
        const status = base64ToByte(value);
        console.log('STATUS_CHAR_UUID', status);
        store.dispatch(setWifiStatus(status));
      })
    );

    this.subscriptions.push(
      safeMonitor(NET_SETUP_STATUS_CHAR_UUID, (value) => {
        const status = base64ToByte(value);
        console.log('NET_SETUP_STATUS_CHAR_UUID', status);
      })
    );

    this.subscriptions.push(
      safeMonitor(WIFI_LIST_CHAR_UUID, (value) => {
        try {
          const data = JSON.parse(base64ToString(value));
          if (Array.isArray(data)) {
            store.dispatch(setWifiNetworks(data));
            store.dispatch(setWifiScanStatus(2));
          } else {
            store.dispatch(setWifiScanStatus(data.s ?? data.status));
            store.dispatch(setWifiNetworks(data.n ?? data.networks ?? []));
          }
        } catch {}
      })
    );

    this.subscriptions.push(
      safeMonitor(NET_STATUS_CHAR_UUID, (value) => {
        try {
          const data = JSON.parse(base64ToString(value));
          store.dispatch(
            setNetworkStatus({
              status: data.status,
              connected: data.connected,
              type: data.type || ConnectionType.NONE,
              interface: data.interface,
              details: data.details,
            })
          );
        } catch {}
      })
    );

    this.subscriptions.push(
      safeMonitor(AUTH_STATUS_CHAR_UUID, (value) => {
        const status = base64ToByte(value);
        store.dispatch(setAuthStatus(status));
        store.dispatch(setIsAuthenticated(status === AuthStatus.AUTHENTICATED));
      })
    );

    // Only ONE disconnect handler
    const disconnectSub = bleManager.onDeviceDisconnected(device.id, () => {
      console.log('[BLE] Disconnected event received');

      if (this.isDisconnecting) return;

      this.internalDisconnectCleanup();
    });

    this.subscriptions.push(disconnectSub);
  }

  private internalDisconnectCleanup() {
    if (!this.isConnected) return;

    this.isConnected = false;
    this.isDisconnecting = true;

    this.safeCleanupSubscriptions();
    this.cleanupNetSetupTimeout();
    this.cleanupNetCheckTimeout();

    this.connectedDevice = null;
    store.dispatch(resetConnectionState());

    this.isDisconnecting = false;
  }

  private safeCleanupSubscriptions(): void {
    if (this.isCleaningUp) return;

    this.isCleaningUp = true;

    // Only call sub.remove() — do NOT also call cancelTransaction() for the
    // same monitor. Calling both fires the error callback twice; the second
    // time the native layer passes a null error code into PromiseImpl.reject,
    // causing a NullPointerException crash on Android.
    const subs = this.subscriptions.splice(0); // clear first to prevent re-entry
    subs.forEach((sub) => {
      try {
        sub?.remove?.();
      } catch {}
    });

    this.isCleaningUp = false;
  }

  private cleanupNetCheckTimeout(): void {
    if (this.netCheckTimeout) {
      clearTimeout(this.netCheckTimeout);
      this.netCheckTimeout = null;
    }
  }

  private cleanupNetSetupTimeout(): void {
    if (this.netSetupTimeout) {
      clearTimeout(this.netSetupTimeout);
      this.netSetupTimeout = null;
    }
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  private cleanupSubscriptions(): void {
    const subs = this.subscriptions.splice(0);
    subs.forEach((sub) => {
      try {
        sub?.remove?.();
      } catch (e) {
        console.log('[BLE] Safe remove subscription error:', e);
      }
    });
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
    this.cleanupNetSetupTimeout();
    this.cleanupNetCheckTimeout();
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
      console.log('[BLE] Permission request error:', error);
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
    bleManager.startDeviceScan(
      [SERVICE_UUID],
      {
        scanMode: 2,
        allowDuplicates: true,
      },
      (error, device) => {
        if (error) {
          const errorMsg = error?.message ?? 'BLE scan error';
          store.dispatch(setError(errorMsg));
          return;
        }

        if (device) {
          store.dispatch(addDevice(toSerializableDevice(device)));
        }
      }
    );

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

  connect = async (device: Device | SerializableDevice, pinCode: string) => {
    try {
      if (this.isConnected) {
        return { success: true };
      }

      const connectedDevice = await bleManager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      this.connectedDevice = connectedDevice;
      this.isConnected = true;

      await this.setupSubscriptions(connectedDevice);

      store.dispatch(
        setConnected({
          isConnected: true,
          deviceId: connectedDevice.id,
        })
      );

      const auth = await this.authenticate(connectedDevice, pinCode);

      if (!auth) {
        await this.disconnect();
        return { success: false, reason: 'INVALID_PIN' };
      }

      return { success: true };
    } catch (err) {
      console.log('[BLE] connect error:', err);
      await this.disconnect();
      return { success: false };
    }
  };

  private async authenticate(device: Device, pinCode: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let finished = false;

      const timeout = setTimeout(() => {
        if (finished) return;
        finished = true;
        unsubscribe();
        resolve(false);
      }, 5000);

      const unsubscribe = store.subscribe(() => {
        const { authStatus } = store.getState().ble;

        if (authStatus === AuthStatus.AUTHENTICATED) {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }

        if (authStatus === AuthStatus.INVALID_PIN) {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(false);
        }
      });

      try {
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          PIN_CHAR_UUID,
          stringToBase64(pinCode)
        );
      } catch (err: any) {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          unsubscribe();
          const errorObj = err && typeof err === 'object' ? err : { message: String(err) };
          reject({ code: errorObj.code || 'BLE_ERROR', message: errorObj.message || 'BLE error' });
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // DISCONNECT
  // ---------------------------------------------------------------------------

  disconnect = async (): Promise<void> => {
    if (!this.isConnected) return;

    this.isDisconnecting = true;

    try {
      this.safeCleanupSubscriptions();
      this.cleanupNetSetupTimeout();
      this.cleanupNetCheckTimeout();

      if (this.connectedDevice) {
        await bleManager.cancelDeviceConnection(this.connectedDevice.id);
      }
    } catch {}

    this.connectedDevice = null;
    this.isConnected = false;
    this.isDisconnecting = false;

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

    return new Promise(async (resolve) => {
      let finished = false;

      const done = (result: boolean) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(result);
      };

      store.dispatch(setWifiStatus(WiFiStatus.WAITING));

      const unsubscribe = store.subscribe(() => {
        const { wifiStatus } = store.getState().ble;
        if (wifiStatus === WiFiStatus.SUCCESS) {
          done(true);
        } else if (wifiStatus === WiFiStatus.ERROR) {
          done(false);
        }
      });

      const timeout = setTimeout(() => {
        store.dispatch(setError('WiFi connection timeout - no response from device'));
        done(false);
      }, 30000);

      try {
        store.dispatch(clearError());

        await this.connectedDevice!.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          SSID_CHAR_UUID,
          stringToBase64(ssid)
        );

        await this.connectedDevice!.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          PWD_CHAR_UUID,
          stringToBase64(password)
        );
      } catch (err: any) {
        console.log('[BLE] sendWiFiCredentials write error:', err);
        // store.dispatch(setError(err?.message || 'WiFi credentials write error'));
        done(false);
      }
    });
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
      }, 15000); // 30 seconds timeout

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
   * Request network connection status from Jetson for a given interface type.
   * Writes one byte NET_TYPE[type] (base64) to NET_CHECK_CHAR_UUID; device responds on NET_STATUS_CHAR_UUID.
   */
  checkNetworkStatus = async (type: NetCheckType): Promise<boolean> => {
    if (!this.connectedDevice) {
      store.dispatch(setError('Not connected to the device'));
      return false;
    }

    const netTypeByte = NET_TYPE[type];

    try {
      this.cleanupNetCheckTimeout();
      store.dispatch(clearError());
      const payload = Buffer.from([netTypeByte]).toString('base64');
      await this.connectedDevice.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        NET_CHECK_CHAR_UUID,
        payload
      );

      this.netCheckTimeout = setTimeout(() => {
        console.log('[BLE] Network check timeout');
        store.dispatch(setError('Network status timeout - no response from device'));
        this.netCheckTimeout = null;
      }, 10000);

      return true;
    } catch (err: any) {
      this.cleanupNetCheckTimeout();
      store.dispatch(setError(err?.message || 'Network status request failed'));
      return false;
    }
  };

  /**
   * Tell the device which network path to use for setup (LAN vs LTE).
   * Writes UTF-8 mode string as base64 to NET_SETUP_CHAR_UUID, then waits
   * for a status notification on NET_SETUP_STATUS_CHAR_UUID (timeout 30 s).
   * Returns true only when the device confirms successful setup.
   */
  netSetupConnect = async (mode: NetSetupMode): Promise<boolean> => {
    if (!this.connectedDevice) {
      store.dispatch(setError('Not connected to the device'));
      return false;
    }

    return new Promise(async (resolve) => {
      let finished = false;
      let sub: Subscription | null = null;

      const done = (result: boolean) => {
        if (finished) return;
        finished = true;
        this.cleanupNetSetupTimeout();
        try {
          sub?.remove();
        } catch {}
        resolve(result);
      };

      // Subscribe BEFORE writing so no notification is missed
      sub = this.connectedDevice!.monitorCharacteristicForService(
        SERVICE_UUID,
        NET_SETUP_STATUS_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            if (
              error.errorCode === BleErrorCode.OperationCancelled ||
              error.errorCode == null ||
              error.message?.toLowerCase().includes('cancel')
            ) {
              return;
            }
            console.log('[BLE] NET_SETUP_STATUS monitor error:', error.message);
            done(false);
            return;
          }

          if (characteristic?.value) {
            const byte = base64ToByte(characteristic.value);
            if (byte === 2) {
              done(true);
            } else if (byte === 3) {
              done(false);
            }
            // byte === 1 (in-progress) or any other intermediate state → ignore
          }
        }
      );

      this.netSetupTimeout = setTimeout(() => {
        console.log('[BLE] Network setup timeout');
        store.dispatch(setError('Network setup timeout - no response from device'));
        done(false);
      }, 30000);

      try {
        store.dispatch(clearError());
        const payload = Buffer.from(mode, 'utf-8').toString('base64');
        await this.connectedDevice!.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          NET_SETUP_CHAR_UUID,
          payload
        );
      } catch (err: any) {
        console.log('NET_SETUP_CHAR_UUID err', err);
        store.dispatch(setError(err?.message || 'Network setup failed'));
        done(false);
      }
    });
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
