import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ConnectDeviceScreenNavigationProp } from '@navigation/types';
import { SerializableDevice } from '@redux/slices/bleSlice';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import BluetoothIcon from '@assets/svg/bluetooth-icon.svg';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import { styles } from './ConnectDevice.styles';
import RadarScan from '@screens/ConnectDevice/RadarScan';
import { useTranslation } from 'react-i18next';
import RotateCcwIcon from '@assets/svg/rotate-ccw.svg';
import CctvIcon from '@assets/svg/cctv-icon.svg';
import { useJetsonBLE } from '@hooks/useJetsonBLE';

const getScanningText = (activeTab: string, scanning: boolean, scanningWifi: boolean, t: any) => {
  const isScanning = activeTab === 'bluetooth' ? scanning : scanningWifi;
  return isScanning ? t('bluetoothScreen.scanningForDevices') : t('bluetoothScreen.scanFinished');
};

const getHintText = (activeTab: string, t: any) => {
  return activeTab === 'bluetooth'
    ? t('bluetoothScreen.makeSureYourCameraIsPoweredOn')
    : t('bluetoothScreen.makeSureYourCameraWiFiAPIsPoweredOn');
};

const ConnectDevice: React.FC = () => {
  const navigation = useNavigation<ConnectDeviceScreenNavigationProp>();
  const [isConnect, setConnect] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  const [activeTab, setActiveTab] = useState<'bluetooth' | 'wifi'>('bluetooth');
  const [wifiList, setWifiList] = useState<
    { ssid: string; signal: 'strong' | 'weak'; id: string }[]
  >([]);
  const [scanningWifi, setScanningWifi] = useState(false);

  const { devices, isScanning: scanning, startScan, stopScan, connect } = useJetsonBLE();

  const { t } = useTranslation();

  useEffect(() => {
    if (activeTab === 'bluetooth') void startScan();
    else void startWifiScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

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

  const goToPairCode = async (device: SerializableDevice) => {
    try {
      setConnect(true);
      setAlertShown(false);

      // Use the hook's connect method instead of manual BLE connection
      await connect(device);

      setConnect(false);

      // Navigate to PairingCode with device info
      navigation.navigate('PairingCode', {
        device: {
          id: device.id,
          name: device.name,
          isConnectable: device.isConnectable,
          localName: device.localName,
          manufacturerData: device.manufacturerData,
          serviceUUIDs: device.serviceUUIDs,
        },
        pairingCode: '',
      });
    } catch (err) {
      setConnect(false);
      if (!alertShown) {
        setAlertShown(true);
        Alert.alert(t('bluetoothScreen.connectionFailed'), String(err), [
          { text: 'OK', onPress: () => setAlertShown(false) },
        ]);
      }
    }
  };

  const scanningText = getScanningText(activeTab, scanning, scanningWifi, t);
  const hintText = getHintText(activeTab, t);

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
          <Text style={styles.textHeader}>
            {t('bluetoothScreen.selectAConnectionMethodToSetupYourJetsonOrinCamera')}
          </Text>

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

          <Text style={styles.scanningText}>{scanningText}</Text>
          <Text style={styles.hintText}>{hintText}</Text>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>{devicesFoundText}</Text>
            <TouchableOpacity
              onPress={activeTab === 'bluetooth' ? startScan : startWifiScan}
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

          {/* Scrollable section */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
                        onPress={() => {
                          if (item && item.id) {
                            void goToPairCode(item);
                          } else {
                            console.error('Invalid device selected for connection');
                            if (!alertShown) {
                              setAlertShown(true);
                              Alert.alert(
                                t('bluetoothScreen.error'),
                                t('bluetoothScreen.invalidDevice'),
                                [{ text: 'OK', onPress: () => setAlertShown(false) }]
                              );
                            }
                          }
                        }}
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
