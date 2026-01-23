import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ImageBackground, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import QrScannerBackground from '@assets/png/qr-scan-background.png';
import Logo from '@assets/svg/logo.svg';
import CompleteIcon from '@assets/svg/complete-icon.svg';
import { useResponsive } from '@hooks/useResponsive';
import { styles } from './SetupComplete.styles';

const SetupComplete: React.FC = () => {
  const navigation = useNavigation();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const responsive = useResponsive();

  useEffect(() => {
    // Success animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToDashboard = () => {
    navigation.navigate('Home' as any);
  };

  const handleGoToCameraSettings = () => {
    // TODO: Implement camera settings navigation
  };

  const Content = (
    <View style={styles.content}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo width={responsive.isTablet ? 400 : 245} height={responsive.isTablet ? 100 : 70} />
        <CompleteIcon
          width={responsive.isTablet ? 235 : 150}
          height={responsive.isTablet ? 235 : 150}
        />
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.successTitle}>登録完了</Text>
        <Text style={styles.successMessage}>デバイスが正常に登録されました！</Text>
        <Text style={styles.successMessage}>これで使用する準備が整いました。</Text>
      </View>

      {/* Camera Info Card */}
      <View style={responsive.isLandscape ? styles.cameraCardLandscape : styles.cameraCard}>
        <View style={styles.cameraImageContainer}>
          <Icon name="cctv" size={32} color="#00D9FF" />
        </View>
        <View style={styles.cameraInfo}>
          <Text style={styles.cameraName}>AIVIS Pro Cam 1</Text>
          <Text style={styles.cameraSerial}>シリアル：8923-XXXX-1Z</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>オンライン・準備完了</Text>
          </View>
        </View>
      </View>
      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
          <Text style={styles.dashboardButtonText}>ダッシュボードへ</Text>
          <Icon name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={handleGoToCameraSettings}>
          <Icon name="cog" size={20} color="#FFF" />
          <Text style={styles.settingsButtonText}>カメラ設定</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={QrScannerBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.styleLandscape}>{Content}</ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default SetupComplete;
