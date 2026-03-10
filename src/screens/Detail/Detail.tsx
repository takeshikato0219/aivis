import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { styles } from './Detail.styles';

import BackIcon from '@assets/svg/icon-back.svg';
import SettingsIcon from '@assets/svg/icon-setting.svg';
import LogoDetail from '@assets/svg/logo-detail.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import IconWarningUnActive from '@assets/svg/icon-warning-unactive.svg';
import IconWarningActive from '@assets/svg/icon-warning-active.svg';
import IconSafeActive from '@assets/svg/icon-safe-active.svg';
import IconSafeUnActive from '@assets/svg/icon-safe-unactive.svg';
import IconUnlockActive from '@assets/svg/icon-lock-active.svg';
import IconUnlockUnActive from '@assets/svg/icon-lock-unactive.svg';
import RetangleImage from '@assets/png/rectangle-home.png';
import CameraHomeDetailBgPng from '@assets/png/camera-home-detail-bg.png';
import CameraFactoryDetailBgPng from '@assets/png/camera-factory-detail-bg.png';
import CameraShopDetailBgPng from '@assets/png/camera-shop-detail-bg.png';
import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconLive from '@assets/svg/icon-live.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import IconListFace from '@assets/svg/icon-list-face.svg';

import { DetailScreenNavigationProp, DetailScreenRouteProp } from '@navigation/types';
import { COLORS } from '@constants/theme';
import cameraService from '@api/cameraService';

const livingItem = {
  id: '4',
  name: 'ライブカメラ',
  status: true,
  counter: '5',
};

const ICONS = [IconHome, IconPerson, IconSuspect, IconLive, IconBear, IconListFace];
const ICON_NAMES = [
  'IconHome',
  'IconPerson',
  'IconSuspect',
  'IconLive',
  'IconBear',
  'IconListFace',
];

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const Detail = () => {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const route = useRoute<DetailScreenRouteProp>();
  const { t } = useTranslation();
  const camera = route.params?.camera;
  const title = camera?.name || 'Detail';
  const filters = [
    {
      name: t('detail.alertMode'),
      iconActive: IconWarningActive,
      iconUnActive: IconWarningUnActive,
    },
    {
      name: t('detail.safeMode'),
      iconActive: IconSafeActive,
      iconUnActive: IconSafeUnActive,
    },
    {
      name: t('detail.releaseMode'),
      iconActive: IconUnlockActive,
      iconUnActive: IconUnlockUnActive,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lastFrameUri, setLastFrameUri] = useState<string | null>(null);
  const [rulesList, setRulesList] = useState<any[]>([]);

  const getRulesMaster = useCallback(async () => {
    try {
      const response = await cameraService.getRulesForCamera(camera.id);
      if (response.success) {
        setRulesList(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch rules:', err);
    }
  }, [camera?.id]);

  useFocusEffect(
    useCallback(() => {
      setLastFrameUri(null);

      const loadLastFrame = async () => {
        try {
          const savedPath = await AsyncStorage.getItem(`camera_last_frame_${camera?.id}`);
          if (savedPath) {
            const exists = await RNFS.exists(savedPath);
            if (exists) {
              setLastFrameUri(`file://${savedPath}?t=${Date.now()}`);
            } else {
              setLastFrameUri(null);
            }
          }
        } catch (err) {
          console.warn('Failed to load last frame:', err);
        }
      };
      loadLastFrame();
      getRulesMaster();
    }, [camera?.id, getRulesMaster])
  );

  const backgrounds = [CameraShopDetailBgPng, CameraHomeDetailBgPng, CameraFactoryDetailBgPng];

  const statusText =
    camera?.status == null
      ? 'Offline'
      : typeof camera.status === 'object'
        ? camera.status.name_trans
        : camera.status || 'Online';

  const isOnline =
    statusText.toLowerCase().includes('online') || statusText.toLowerCase().includes('オンライン');

  const handleCameraPress = () => {
    navigation.navigate('CameraLive', {
      cameraId: camera.id,
      cameraName: camera.name,
    });
  };


  const mappedInitialList = rulesList.map((rule) => ({
    id: rule.id,
    name: rule.name,
    status: rule.is_active,
    counter: '5人',
  }));

  const CAMERA_LIST = [
    ...mappedInitialList.slice(0, 3),
    livingItem,
    ...mappedInitialList.slice(3),
    {
      id: '6',
      name: '人物登録',
      status: true,
      counter: '4人',
    },
  ];

  const handlePressNotification = (itemName: string, iconName: string) => {
    navigation.navigate('ListNotificationCamera', { title: itemName, icon: iconName });
  };

  const handlePressCustomerReport = (itemName: string, iconName: string) => {
    navigation.navigate('CustomerReport', { title: itemName, icon: iconName });
  };

  const handleSetupDetectionZone = () => {
    navigation.navigate('SettingAI', {
      camera: camera,
    });
  };

  const goToFaceUpload = () => {
    navigation.navigate('ListFace', { type: '' });
  };

  const getCameraListItemPressHandler = (item: (typeof CAMERA_LIST)[number], idx: number) => {
    if (idx === 3) return handleCameraPress;
    if (idx === 1) return () => handlePressCustomerReport(item.name, ICON_NAMES[idx]);
    if (idx === CAMERA_LIST.length - 1) return goToFaceUpload;
    return () => handlePressNotification(item.name, ICON_NAMES[idx]);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={backgrounds[activeIndex]}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>

            <View style={styles.viewTitle}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSetupDetectionZone}>
              <SettingsIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollViewPaddingBottom}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <TouchableOpacity onPress={() => handleCameraPress()}>
                <View style={styles.card}>
                  <View style={styles.videoWrapper}>
                    <Image
                      source={lastFrameUri ? { uri: lastFrameUri, cache: 'reload' } : RetangleImage}
                      style={styles.cardImage}
                    />
                  </View>
                  <View style={styles.cardBadge}>
                    <View
                      style={[
                        styles.badgeDot,
                        { backgroundColor: isOnline ? COLORS.FF0000 : COLORS.gray696969 },
                      ]}
                    />
                    <Text style={styles.badgeText}>{statusText}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.cartSecurityMode}>
                <Text style={styles.textSecurityMode}>{t('detail.securityMode')}</Text>
                <LogoDetail />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}
              >
                {filters.map((filter, idx) => {
                  const Icon = activeIndex === idx ? filter.iconActive : filter.iconUnActive;

                  const handleTabPress = () => {
                    if (activeIndex === idx) return;
                    Alert.alert(
                      t('common.confirm'),
                      t('detail.doYouWantToSwitchMode'),
                      [
                        {
                          text: t('common.cancel'),
                          style: 'cancel',
                        },
                        {
                          text: t('common.ok'),
                          onPress: () => setActiveIndex(idx),
                        },
                      ],
                      { cancelable: true }
                    );
                  };

                  return (
                    <TouchableOpacity
                      key={filter.name}
                      style={[
                        styles.filterBtn,
                        activeIndex === idx && styles.activeFilterBtn,
                        activeIndex === idx && styles.filterBtnActiveWarning,
                      ]}
                      onPress={handleTabPress}
                    >
                      <Icon />
                      <Text style={styles.filterText}>{filter.name}</Text>
                      <Text style={styles.filterSmall}>{t('detail.textNotification')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            {/* Camera List */}
            {CAMERA_LIST.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <ItemSeparator />}
                <TouchableOpacity
                  onPress={getCameraListItemPressHandler(item, idx)}
                  disabled={!item.status}
                >
                  <ImageBackground
                    style={[styles.rowFront, !item.status && styles.disableBackground]}
                    resizeMode="cover"
                  >
                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {ICONS[idx] && (
                        // eslint-disable-next-line react-native/no-inline-styles
                        <View style={{ marginRight: 8 }}>
                          {React.createElement(ICONS[idx], {
                            width: 24,
                            height: 24,
                            style: !item.status ? styles.disableIcon : undefined,
                          })}
                        </View>
                      )}
                      <View>
                        <Text style={[styles.filterText, !item.status && styles.disableText]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.filterText, !item.status && styles.disableText]}>
                          {item.counter}
                        </Text>
                      </View>
                    </View>
                    <MoveRightIcon style={!item.status ? styles.disableIcon : undefined} />
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Detail;
