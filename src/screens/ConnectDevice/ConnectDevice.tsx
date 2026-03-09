import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ConnectDeviceScreenNavigationProp } from '@navigation/types';
import { SerializableDevice } from '@redux/slices/bleSlice';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import BluetoothIcon from '@assets/svg/bluetooth-icon.svg';
import { styles } from './ConnectDevice.styles';
import RadarScan from '@screens/ConnectDevice/RadarScan';
import { useTranslation } from 'react-i18next';
import RotateCcwIcon from '@assets/svg/rotate-ccw.svg';
import CctvIcon from '@assets/svg/cctv-icon.svg';
import { useJetsonBLE } from '@hooks/useJetsonBLE';
import { BleManager } from 'react-native-ble-plx';

const getScanningText = (scanning: boolean, t: any) => {
  return scanning ? t('bluetoothScreen.scanningForDevices') : t('bluetoothScreen.scanFinished');
};

const getHintText = (t: any) => {
  return t('bluetoothScreen.makeSureYourCameraIsPoweredOn');
};

const RADAR_SIZE = 180;
const RADAR_CENTER = RADAR_SIZE / 2;

const getDeviceDots = (deviceCount: number) => {
  return Array.from({ length: deviceCount }).map(() => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = RADAR_CENTER * (0.3 + 0.65 * Math.random());
    return {
      x: RADAR_CENTER + radius * Math.cos(angle),
      y: RADAR_CENTER + radius * Math.sin(angle),
    };
  });
};

const ConnectDevice: React.FC = () => {
  const navigation = useNavigation<ConnectDeviceScreenNavigationProp>();
  const [alertShown, setAlertShown] = useState(false);
  const manager = new BleManager();

  const { devices, isScanning: scanning, startScan, stopScan } = useJetsonBLE();

  const { t } = useTranslation();

  const checkBluetooth = async () => {
    const state = await manager.state();
    if (state !== 'PoweredOn') {
      Alert.alert(
        t('bluetoothScreen.bluetoothIsOff'),
        t('bluetoothScreen.pleaseTurnOnBluetoothToScanForNearbyCameras'),
        [
          {
            text: t('bluetoothScreen.openSettings'),
            onPress: () => openBluetoothSettings(),
          },
          { text: t('permission.cancel'), style: 'cancel' },
        ]
      );
      return false;
    }
    return true;
  };

  const openBluetoothSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    } else if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=Bluetooth').catch(() => {
        Alert.alert(
          t('bluetoothScreen.unableToOpenSettings'),
          t('bluetoothScreen.pleaseOpenBluetoothSettingsManually')
        );
      });
    }
  };

  useEffect(() => {
    checkBluetooth();
    // Auto-scan when component mounts (only if not already scanning)
    if (!scanning) {
      void startScan();
    }

    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPairCode = (device: SerializableDevice) => {
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
  };

  const scanningText = getScanningText(scanning, t);
  const hintText = getHintText(t);

  const devicesFoundText =
    t('bluetoothScreen.devicesFound') + (scanning ? '' : ` (${devices.length})`);

  const deviceDots = getDeviceDots(devices.length);

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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('bluetoothScreen.connectDevice')}</Text>
          </View>
          <Text style={styles.textHeader}>
            {t('bluetoothScreen.selectAConnectionMethodToSetupYourJetsonOrinCamera')}
          </Text>

          {/* Tabs */}
          <View style={styles.modeSwitcher}>
            <View style={[styles.switchBtn, styles.switchBtnActive]}>
              <BluetoothIcon />
              <Text style={styles.switchTextActive}>Bluetooth</Text>
            </View>
          </View>

          {/* Radar graphic */}
          <View style={styles.radarContainer}>
            <RadarScan deviceDots={deviceDots} />
          </View>

          <Text style={styles.scanningText}>{scanningText}</Text>
          <Text style={styles.hintText}>{hintText}</Text>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>{devicesFoundText}</Text>
            <TouchableOpacity
              onPress={async () => {
                const isBluetoothOn = await checkBluetooth();
                if (isBluetoothOn) {
                  startScan();
                }
              }}
              disabled={scanning}
              style={styles.styleRotate}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RotateCcwIcon />
              <Text style={[styles.scanAgain, scanning ? styles.scanAgainOpacity : null]}>
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
              {scanning && (
                <View style={styles.viewScanning}>
                  <ActivityIndicator size="large" color="#38E9FF" />
                </View>
              )}

              {/* Bluetooth List */}
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
                          {item.name || t('bluetoothScreen.unknownDevice')}
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
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default ConnectDevice;
