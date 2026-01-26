import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageBackground,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useAppSelector } from '@redux/store';
import { useNavigation } from '@react-navigation/native';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './Home.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HomeBackgroundImage from '@assets/png/home-background.png';
import RetangleImage from '@assets/png/rectangle-home.png';
import BellIcon from '@assets/svg/bell-icon.svg';
import MenuIcon from '@assets/svg/meun-icon.svg';
import MoveRightIconCircle from '@assets/svg/move-right-circle.svg';
import DrawerMenu from '@components/DrawerMenu/DrawerMenu';
import { HomeScreenNavigationProp } from '@navigation/types';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserSync } from '@hooks/useUserSync';

const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAppSelector((state) => state.auth);
  const [activeIndex, setActiveIndex] = useState(0);
  const filters = ['すべて', 'キッチン', 'ダイニングルーム', 'デザイン室'];
  const { width } = useWindowDimensions();
  const isPad = Platform.OS === 'ios' && width >= 768;
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const avatarUrl = user?.avatar_url;
  const [avatarError, setAvatarError] = useState(false);
  // USING COMMON HOOKS
  const { syncUserData } = useUserSync();
  useAppSetup({ screenName: 'Home' });

  useEffect(() => {
    if (isDrawerOpen) {
      syncUserData();
    }
  }, [isDrawerOpen, syncUserData]);

  const goToDetail = () => {
    navigation.navigate('Detail', {
      name: '石上１丁目家のカメラ',
      id: 'camera-001',
      cameraId: 'cam-123',
    });
  };

  const goToQrScanner = () => {
    navigation.navigate('QRScanner' as never);
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
              {avatarUrl && !avatarError ? (
                <Image
                  source={{ uri: user?.avatar_url || '' }}
                  style={styles.avatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <Icon name="account" size={50} color="#34C759" style={styles.avatar} />
              )}
              <View style={styles.headerInfo}>
                <Text style={styles.userName}>{t('home.welcomeBack')}</Text>
                <Text style={styles.subTitle}>{user?.name ? `${user.name}` : 'user name'}</Text>
              </View>
              {/* Notification and Drawer icons */}
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications' as never)}
                  style={styles.iconBtn}
                >
                  <BellIcon />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.iconBtn}>
                  <MenuIcon />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.title}>
              {isPad ? (
                <Text style={styles.titleText}>
                  {t('home.liveView')}
                  {t('home.stayConnected')}
                </Text>
              ) : (
                <>
                  <Text style={styles.titleText}>{t('home.liveView')}</Text>
                  <Text style={styles.titleText}>{t('home.stayConnected')}</Text>
                </>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {filters.map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.filterBtn, activeIndex === idx && styles.activeFilterBtn]}
                  onPress={() => setActiveIndex(idx)}
                >
                  <Text style={styles.filterText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.card}>
              <View style={styles.videoWrapper}>
                <Image source={RetangleImage} style={styles.cardImage} />
              </View>
              <View style={styles.cardBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Online</Text>
              </View>
              <TouchableOpacity onPress={goToDetail}>
                <View style={styles.rowCenter}>
                  <Text style={styles.cardText}>石上１丁目家のカメラ</Text>
                  <View style={styles.iconCircle}>
                    <MoveRightIconCircle />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.manualButton} onPress={goToQrScanner}>
              <Icon name="camera" size={32} color="#00D9FF" />
              <Text style={styles.manualButtonText}>{t('home.addCamera')}</Text>
              <MoveRightIcon />
            </TouchableOpacity>
          </ScrollView>
          <DrawerMenu
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            avatarUrl={avatarUrl ?? undefined}
          />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Home;
