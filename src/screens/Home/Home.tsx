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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserSync } from '@hooks/useUserSync';
import CleanShotIcon from '@assets/svg/clean-shot.svg';
import PlusIcon from '@assets/svg/plus-icon.svg';
import IconBlue from '@assets/svg/icon-blue.svg';
import cameraService from '@api/cameraService';
import { Camera } from '@api/types/cameraTypes';
import { useErrorHandler } from '@hooks/useErrorHandler';

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
  const [cameraList, setCameraList] = useState<Camera[]>([]);
  const { handleError } = useErrorHandler();

  // USING COMMON HOOKS
  const { syncUserData } = useUserSync();
  useAppSetup({ screenName: 'Home' });

  useEffect(() => {
    fetchCameraList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      syncUserData();
    }
  }, [isDrawerOpen, syncUserData]);

  const fetchCameraList = async () => {
    try {
      const response = await cameraService.getCameras({
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 1,
        per_page: 20,
      });
      setCameraList(response.data || []);
    } catch (error: any) {
      console.error('Error fetching camera list:', error);
      handleError(error, false);
      setCameraList([]);
    }
  };

  const goToDetail = (camera: Camera) => {
    navigation.navigate('Detail', {
      name: camera.name,
      id: camera.id,
      cameraId: camera.id,
    });
  };

  const goToBluetoothScan = () => {
    navigation.navigate('ConnectDevice' as never);
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
                <Icon name="account" size={50} color="#00ADD4" style={styles.avatar} />
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
            {cameraList.length > 0 ? (
              <>
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterRow}
                >
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
                {cameraList.map((camera) => (
                  <View style={styles.card} key={camera.id}>
                    <View style={styles.videoWrapper}>
                      <Image source={RetangleImage} style={styles.cardImage} />
                    </View>
                    <View style={styles.cardBadge}>
                      <View style={styles.badgeDot} />
                      <Text style={styles.badgeText}>{String(camera.status ?? '')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => goToDetail(camera)}>
                      <View style={styles.rowCenter}>
                        <Text style={styles.cardText}>{camera.name}</Text>
                        <View style={styles.iconCircle}>
                          <MoveRightIconCircle />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.styleEmptyList}>
                <CleanShotIcon />
                <Text style={styles.textStyleReady}>{t('home.readyToPair')}</Text>
                <View style={styles.styleViewCameraAndEnsure}>
                  <IconBlue />
                  <Text style={styles.textCameraAndEnsure}>{t('home.cameraAndEnsure')}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.manualButton} onPress={goToBluetoothScan}>
              <PlusIcon />
              <Text style={styles.manualButtonText}>{t('home.addCamera')}</Text>
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
