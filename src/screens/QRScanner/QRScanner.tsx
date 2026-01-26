import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraSetupScreenNavigationProp } from '@navigation/types';
import QrScannerBackground from '@assets/png/qr-scan-background.png';
import { styles } from './QRScanner.styles';
import RectangleIcon4 from '@assets/svg/rectangle-4.svg';
import RectangleIcon5 from '@assets/svg/rectangle-5.svg';
import RectangleIcon6 from '@assets/svg/rectangle-6.svg';
import RectangleIcon7 from '@assets/svg/rectangle-7.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';

const CAMERA_PERMISSION_KEY = '@camera_permission_status';

type PermissionStatus = 'checking' | 'denied' | 'granted' | 'blocked';

const QRScanner: React.FC = () => {
  const navigation = useNavigation<CameraSetupScreenNavigationProp>();
  const device = useCameraDevice('back');
  const window = useWindowDimensions();
  const isLandscape = window.width > window.height;
  const isSmallScreen = window.width < 600 || window.height < 600;
  const shouldUseScrollView = isLandscape && isSmallScreen;

  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [shouldMountCamera, setShouldMountCamera] = useState<boolean>(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const modalScaleAnim = useState(new Animated.Value(0))[0];
  const modalOpacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    (async () => {
      await checkPermissionStatus();
      startPulseAnimation();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const cameraPermission = Camera.getCameraPermissionStatus();

      if (cameraPermission === 'granted') {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'granted');
        setPermissionStatus('granted');
        setShouldMountCamera(true);
      } else if (cameraPermission === 'not-determined') {
        setPermissionStatus('denied');
        setTimeout(() => {
          setShowPermissionModal(true);
          animateModalIn();
        }, 500);
      } else {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'blocked');
        setPermissionStatus('blocked');
      }
    } catch (error) {
      console.log(error);
      setPermissionStatus('denied');
      setTimeout(() => {
        setShowPermissionModal(true);
        animateModalIn();
      }, 500);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateModalIn = () => {
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateModalOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPermissionModal(false);
      callback();
    });
  };

  const handleAllowPermission = async () => {
    animateModalOut(async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'granted') {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'granted');
        setPermissionStatus('granted');
        setShouldMountCamera(true);
      } else {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'blocked');
        setPermissionStatus('blocked');
      }
    });
  };

  const handleDenyPermission = async () => {
    await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'blocked');
    animateModalOut(() => {
      navigation.navigate('CameraSetup', { qrData: null });
    });
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !scannedData && !isSearching) {
        const qrData = codes[0].value;
        setScannedData(qrData || '');
        setIsSearching(true);
        setTimeout(() => {
          navigation.navigate('CameraSetup', { qrData: qrData || null });
        }, 2000);
      }
    },
  });

  const handleManualConnect = () => {
    navigation.navigate('CameraSetup', { qrData: null });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const renderPermissionModal = () => (
    <Modal
      visible={showPermissionModal}
      transparent
      animationType="none"
      onRequestClose={handleDenyPermission}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlay, { opacity: modalOpacityAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalScaleAnim }] }]}>
          <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#0A3A2A']} style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Icon name="camera" size={48} color="#00FFAA" />
              </View>
            </View>
            <Text style={styles.modalTitle}>カメラへのアクセス</Text>
            <Text style={styles.modalDescription}>
              QRコードをスキャンするために{'\n'}カメラへのアクセスが必要です
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="qrcode-scan" size={20} color="#00FFAA" />
                <Text style={styles.featureText}>QRコードをスキャン</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="shield-check" size={20} color="#00FFAA" />
                <Text style={styles.featureText}>安全なデバイス登録</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="flash" size={20} color="#00FFAA" />
                <Text style={styles.featureText}>暗い場所でもスキャン可能</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.allowButton} onPress={handleAllowPermission}>
              <Icon name="check-circle" size={20} color="#0A1A23" />
              <Text style={styles.allowButtonText}>許可する</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.denyButton} onPress={handleDenyPermission}>
              <Text style={styles.denyButtonText}>許可しない</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );

  if (permissionStatus === 'checking') {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFAA" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (permissionStatus === 'blocked') {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <View style={styles.permissionIconContainer}>
            <Icon name="camera-off" size={64} color="#EF4444" />
          </View>
          <Text style={styles.permissionTitle}>カメラの権限が必要です</Text>
          <Text style={styles.permissionText}>
            QRコードをスキャンするには{'\n'}設定からカメラの権限を許可してください
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Icon name="cog" size={20} color="#00FFAA" />
            <Text style={styles.settingsButtonText}>設定を開く</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualConnectButton} onPress={handleManualConnect}>
            <Text style={styles.manualConnectButtonText}>手動で接続</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!device) {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFAA" />
          <Text style={styles.loadingText}>カメラを読み込み中...</Text>

          <TouchableOpacity style={styles.manualButton} onPress={handleManualConnect}>
            <Text style={styles.manualButtonText}>手動で接続</Text>
            <MoveRightIcon />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const HeaderContent = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Icon name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.title}>デバイス登録</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const BodyContent = (
    <>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.qrFrameContainer, { transform: [{ scale: pulseAnim }] }]}>
          {shouldMountCamera && (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              codeScanner={codeScanner}
              torch={isFlashOn ? 'on' : 'off'}
            />
          )}
          <RectangleIcon4 style={[styles.corner, styles.topLeft]} />
          <RectangleIcon5 style={[styles.corner, styles.topRight]} />
          <RectangleIcon6 style={[styles.corner, styles.bottomLeft]} />
          <RectangleIcon7 style={[styles.corner, styles.bottomRight]} />
          {!scannedData && !isSearching && (
            <View style={styles.scanIndicator}>
              <Icon name="qrcode-scan" size={80} color="rgba(0,255,170,0.5)" />
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[styles.flashButton, isFlashOn && styles.flashButtonActive]}
          onPress={() => setIsFlashOn(!isFlashOn)}
          disabled={isSearching}
        >
          <Icon name="flash" size={18} color="#FFF" />
          <Text style={styles.flashText}>Flash {isFlashOn ? 'on' : 'off'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        {isSearching ? (
          <View style={styles.searchingContainer}>
            <View style={styles.bluetoothIcon}>
              <Icon name="bluetooth" size={28} color="#00D9FF" />
            </View>
            <Text style={styles.searchingText}>デバイスを検索中... </Text>
            <Text style={styles.searchingSubtext}>Bluetooth接続中</Text>
            <ActivityIndicator size="small" color="#00D9FF" style={styles.btnSearch} />
          </View>
        ) : null}

        <TouchableOpacity style={styles.manualButton} onPress={handleManualConnect}>
          <Text style={styles.manualButtonText}>手動で接続</Text>
          <MoveRightIcon />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={QrScannerBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        {permissionStatus === 'denied' && renderPermissionModal()}

        {permissionStatus === 'granted' && (
          <SafeAreaView style={styles.overlay} edges={['top']}>
            {HeaderContent}
            {shouldUseScrollView ? (
              <ScrollView
                contentContainerStyle={styles.styleScrollView}
                keyboardShouldPersistTaps="handled"
              >
                {BodyContent}
              </ScrollView>
            ) : (
              <View style={styles.styleScrollView}>{BodyContent}</View>
            )}
          </SafeAreaView>
        )}
      </ImageBackground>
    </View>
  );
};

export default QRScanner;
