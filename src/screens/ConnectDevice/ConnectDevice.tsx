import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
  StatusBar,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ConnectDeviceScreenNavigationProp } from '@navigation/types';
import { Device } from 'react-native-ble-plx';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import BluetoothIcon from '@assets/svg/bluetooth-icon.svg';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import { styles } from './ConnectDevice.styles';
import RadarScan from '@screens/ConnectDevice/RadarScan';
import bleManager from '@utils/bleManagerSingleton';
import { useTranslation } from 'react-i18next';
import RotateCcwIcon from '@assets/svg/rotate-ccw.svg';
import CctvIcon from '@assets/svg/cctv-icon.svg';

const ConnectDevice: React.FC = () => {
  const navigation = useNavigation<ConnectDeviceScreenNavigationProp>();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isConnect, setConnect] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  const [activeTab, setActiveTab] = useState<'bluetooth' | 'wifi'>('bluetooth');
  const [wifiList, setWifiList] = useState<
    { ssid: string; signal: 'strong' | 'weak'; id: string }[]
  >([]);
  const [scanningWifi, setScanningWifi] = useState(false);

  const { t } = useTranslation();
  const scanTargetPrefix = 'CAM';

  useEffect(() => {
    if (activeTab === 'bluetooth') void startBluetoothScan();
    else void startWifiScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  useEffect(() => {
    let subscription: any;
    try {
      subscription = bleManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          setAlertShown(false);
        }
      }, true);
    } catch (error) {
      console.log('Could not subscribe to Bluetooth state changes:', error);
    }
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  // --- BLE PERMISSION & SCAN ---
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.ACCESS_FINE_LOCATION',
      ].filter(Boolean);
      const results = await PermissionsAndroid.requestMultiple(permissions as any);
      for (const key in results) {
        if (results[key as keyof typeof results] !== PermissionsAndroid.RESULTS.GRANTED) {
          if (!alertShown) {
            setAlertShown(true);
            Alert.alert(
              t('bluetoothScreen.permissionDenied'),
              t('bluetoothScreen.bluetoothPermissionRequiredToScan'),
              [
                {
                  text: 'OK',
                  onPress: () => setAlertShown(false),
                },
              ]
            );
          }
          return false;
        }
      }
    }
    return true;
  };

  const startBluetoothScan = async () => {
    const permissionGranted = await requestPermission();
    if (!permissionGranted) return;

    setDevices([]);
    setScanning(true);
    setDevices((prev) => {
      const hasMockDevice = prev.some((device) => (device as any).isMock);
      if (!hasMockDevice) {
        const mockDevice = {
          id: 'MOCK_DEVICE_TEST',
          name: 'Test Camera Device',
          connect: async () => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            return mockDevice;
          },
          isMock: true,
        } as Device & { isMock?: boolean };
        return [...prev, mockDevice];
      }
      return prev;
    });
    // Ngăn double scan
    bleManager.stopDeviceScan();

    let scanTimeout: NodeJS.Timeout;

    bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        setScanning(false);
        if (scanTimeout) clearTimeout(scanTimeout);
        if (error.message?.includes('powered off') || error.message?.includes('disabled')) {
          if (!alertShown) {
            setAlertShown(true);
            Alert.alert(
              t('bluetoothScreen.bluetoothDisabled'),
              t('bluetoothScreen.pleaseEnableBluetoothToScanForDevices'),
              [{ text: 'OK', onPress: () => setAlertShown(false) }]
            );
          }
        } else if (!error.message?.includes('Operation was cancelled') && !alertShown) {
          setAlertShown(true);
          Alert.alert('Scan Error', error.message, [
            { text: 'OK', onPress: () => setAlertShown(false) },
          ]);
        }
        return;
      }
      if (
        device &&
        ((device.name && device.name.toUpperCase().startsWith(scanTargetPrefix)) ||
          !scanTargetPrefix)
      ) {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    });

    scanTimeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 7000);
  };

  // --- MOCK WiFi scan ---
  const startWifiScan = async () => {
    setScanningWifi(true);
    setWifiList([]);
    setTimeout(() => {
      setWifiList([
        { ssid: 'CAMERA_AP_1', signal: 'strong', id: 'CAMERA_AP_1' },
        { ssid: 'CAMERA_AP_2', signal: 'weak', id: 'CAMERA_AP_2' },
      ]);
      setScanningWifi(false);
    }, 2000);
  };

  // --- BLE Connect/PairCode ---
  const mockRequestPairCode = async (device: Device) => {
    try {
      setConnect(true);
      await device.connect();
      setTimeout(() => {
        setConnect(false);
        setAlertShown(false);
        const code = '86F2A1';
        navigation.navigate('PairingCode', { device, pairingCode: code });
      }, 1200);
    } catch (err) {
      setConnect(false);
      if (!alertShown) {
        setAlertShown(true);
        Alert.alert('Connect failed', String(err), [
          { text: 'OK', onPress: () => setAlertShown(false) },
        ]);
      }
    }
  };

  const scanningText =
    activeTab === 'bluetooth'
      ? scanning
        ? t('bluetoothScreen.scanningForDevices')
        : t('bluetoothScreen.scanFinished')
      : scanningWifi
        ? t('bluetoothScreen.scanningForDevices')
        : t('bluetoothScreen.scanFinished');

  const hintText =
    activeTab === 'bluetooth'
      ? t('bluetoothScreen.makeSureYourCameraIsPoweredOn')
      : t('bluetoothScreen.makeSureYourCameraWiFiAPIsPoweredOn');

  const devicesFoundText =
    activeTab === 'bluetooth'
      ? t('bluetoothScreen.devicesFound') + (scanning ? '' : ` (${devices.length})`)
      : t('bluetoothScreen.accessPointsFound') + (scanningWifi ? '' : ` (${wifiList.length})`);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('bluetoothScreen.connectDevice')}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.switchBtn, activeTab === 'bluetooth' && styles.switchBtnActive]}
              onPress={() => setActiveTab('bluetooth')}
            >
              <BluetoothIcon />
              <Text style={activeTab === 'bluetooth' ? styles.switchTextActive : styles.switchText}>
                Bluetooth
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchBtn, activeTab === 'wifi' && styles.switchBtnActive]}
              onPress={() => setActiveTab('wifi')}
            >
              <WifiIcon />
              <Text style={activeTab === 'wifi' ? styles.switchTextActive : styles.switchText}>
                Access Point
              </Text>
            </TouchableOpacity>
          </View>

          {/* Radar graphic */}
          <View style={styles.radarContainer}>
            <RadarScan />
          </View>

          {/* Loading Overlay */}
          {isConnect && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#38E9FF" />
                <Text style={styles.loadingText}>{t('bluetoothScreen.connecting')}</Text>
              </View>
            </View>
          )}

          {/* Scrollable section */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.scanningText}>{scanningText}</Text>
            <Text style={styles.hintText}>{hintText}</Text>
            <View style={styles.devicesHeader}>
              <Text style={styles.devicesTitle}>{devicesFoundText}</Text>
              <TouchableOpacity
                onPress={activeTab === 'bluetooth' ? startBluetoothScan : startWifiScan}
                disabled={activeTab === 'bluetooth' ? scanning : scanningWifi}
                style={styles.styleRotate}
              >
                <RotateCcwIcon />
                <Text
                  style={[
                    styles.scanAgain,
                    (activeTab === 'bluetooth' ? scanning : scanningWifi)
                      ? styles.scanAgainOpacity
                      : null,
                  ]}
                >
                  {t('bluetoothScreen.scanAgain')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              {activeTab === 'bluetooth'
                ? scanning && (
                    <View style={styles.viewScanning}>
                      <ActivityIndicator size="large" color="#38E9FF" />
                    </View>
                  )
                : scanningWifi && (
                    <View style={styles.viewScanning}>
                      <ActivityIndicator size="large" color="#38E9FF" />
                    </View>
                  )}

              {/* Bluetooth List */}
              {activeTab === 'bluetooth' ? (
                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.id}
                  style={styles.flatList}
                  contentContainerStyle={styles.flatListContainerStyle}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceLeft}>
                        <View style={styles.cameraImageContainer}>
                          <CctvIcon />
                        </View>
                        <View style={styles.deviceInfo}>
                          <Text style={styles.deviceName} numberOfLines={2} ellipsizeMode="tail">
                            {item.name || t('bluetoothScreen.unknownDevice')} - {item.id.slice(-4)}
                          </Text>
                          <View style={styles.signalRow}>
                            <View style={styles.signalDot} />
                            <Text style={styles.signalLabel}>{t('bluetoothScreen.signal')}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => mockRequestPairCode(item)}
                        disabled={scanning}
                      >
                        <Text style={styles.connectBtnText} numberOfLines={1}>
                          {t('bluetoothScreen.connect')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    !scanning ? (
                      <View style={styles.listEmptyComponentStyle}>
                        <Text style={styles.listEmptyComponentTextStyle}>
                          {t('bluetoothScreen.noBluetoothDeviceFound')}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              ) : (
                // Wi-Fi List
                <FlatList
                  data={wifiList}
                  keyExtractor={(item) => item.id}
                  style={styles.flatList}
                  contentContainerStyle={styles.flatListContainerStyle}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceLeft}>
                        <View style={styles.cameraImageContainer}>
                          <WifiIcon width={28} height={28} />
                        </View>
                        <View style={styles.deviceInfo}>
                          <Text style={styles.deviceName} numberOfLines={2} ellipsizeMode="tail">
                            {item.ssid}
                          </Text>
                          <View style={styles.signalRow}>
                            <View
                              style={[
                                styles.signalDot,
                                // eslint-disable-next-line react-native/no-inline-styles
                                {
                                  backgroundColor: item.signal === 'strong' ? '#00FFAA' : '#FFE433',
                                },
                              ]}
                            />
                            <Text style={styles.signalLabel}>
                              {item.signal === 'strong' ? 'Strong' : 'Weak'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => {
                          navigation.navigate('ConnectWifiHotspot', {
                            wifi: item,
                          });
                        }}
                        disabled={scanningWifi}
                      >
                        <Text style={styles.connectBtnText} numberOfLines={1}>
                          {t('bluetoothScreen.connect')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    !scanningWifi ? (
                      <View style={styles.listEmptyComponentStyle}>
                        <Text style={styles.listEmptyComponentTextStyle}>
                          {t('bluetoothScreen.noWiFiAccessPointFound')}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default ConnectDevice;
