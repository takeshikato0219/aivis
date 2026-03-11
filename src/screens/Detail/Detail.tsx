import React, { useState, useCallback, useEffect } from 'react';
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
import rulesService from '@api/rulesService';
import cameraService from '@api/cameraService';
import faceService from '@api/faceService';

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

const MODE_ICONS = [
  { iconActive: IconWarningActive, iconUnActive: IconWarningUnActive },
  { iconActive: IconSafeActive, iconUnActive: IconSafeUnActive },
  { iconActive: IconUnlockActive, iconUnActive: IconUnlockUnActive },
];

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const Detail = () => {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const route = useRoute<DetailScreenRouteProp>();
  const { t } = useTranslation();
  const camera = route.params?.camera;
  const title = camera?.name || 'Detail';
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lastFrameUri, setLastFrameUri] = useState<string | null>(null);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [detailModeId, setDetailModeId] = useState<string | null>(null);
  const [countFace, setCountFace] = useState<number>(0);
  const [countDetection, setCountDetection] = useState<number>(0);

  const getRulesMaster = async () => {
    try {
      const response = await rulesService.getRules({ facility_id: camera.facility_id });
      if (response.success) {
        setRulesList(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch rules:', err);
    }
  };

  const getModes = async () => {
    try {
      const response = await cameraService.getCameraModes();
      if (response.success) {
        setModes(response.data);
        if (detailModeId) {
          const foundIdx = response.data.findIndex((mode: any) => String(mode.id) === detailModeId);
          if (foundIdx !== -1 && foundIdx !== activeIndex) {
            setActiveIndex(foundIdx);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch modes:', err);
    }
  };

  const getCountDetection = useCallback(async () => {
    try {
      const response = await cameraService.countDetections(camera.id);
      if (response.success && typeof response.data === 'number') {
        setCountDetection(response.data);
      } else if (response.success && response.data && typeof response.data.count === 'number') {
        setCountDetection(response.data.count);
      }
    } catch (err) {
      console.warn('Failed to fetch detection count:', err);
    }
  }, [camera.id]);

  const getDetail = async () => {
    try {
      const response = await cameraService.getDetailCamera(camera.id);
      if (response.success && response.data && typeof response.data.mode_id === 'string') {
        setDetailModeId(response.data.mode_id);
        // If modes are already loaded, find and set active index
        if (modes.length > 0) {
          const foundIdx = modes.findIndex(
            (mode: any) => String(mode.id) === response.data.mode_id
          );
          if (foundIdx !== -1 && foundIdx !== activeIndex) {
            setActiveIndex(foundIdx);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch camera detail:', err);
    }
  };

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
      getModes();
      getDetail();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera.id])
  );

  useEffect(() => {
    if (modes.length > 0 && detailModeId) {
      const foundIdx = modes.findIndex((mode: any) => String(mode.id) === String(detailModeId));
      if (foundIdx !== -1 && foundIdx !== activeIndex) {
        setActiveIndex(foundIdx);
      }
    }
  }, [modes, detailModeId, activeIndex]);

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

  const handlePressNotification = (itemName: string, iconName: string) => {
    navigation.navigate('ListNotificationCamera', { title: itemName, icon: iconName });
  };

  const handlePressCustomerReport = (itemName: string, iconName: string) => {
    navigation.navigate('CustomerReport', { title: itemName, icon: iconName });
  };

  const goToFaceUpload = () => {
    navigation.navigate('ListFace', { type: '' });
  };

  type CameraListItem = {
    id: any;
    name: any;
    status: any;
    counter: string;
    code?: string;
    icon?: any;
    iconName?: string;
    handler?: any;
  };

  const defaultRuleConfigs = [
    {
      code: 'home_return_count',
      icon: IconHome,
      iconName: 'IconHome',
      handler: handlePressNotification,
    },
    {
      code: 'daily_passerby',
      icon: IconPerson,
      iconName: 'IconPerson',
      handler: handlePressCustomerReport,
    },
    {
      code: 'unregistered_detection',
      icon: IconSuspect,
      iconName: 'IconSuspect',
      handler: handlePressNotification,
    },
    {
      code: 'creature_detection',
      icon: IconBear,
      iconName: 'IconBear',
      handler: handlePressNotification,
    },
  ];

  const cameraListWithIcons = defaultRuleConfigs.map((config) => {
    const rule = rulesList.find((r) => r.code === config.code);
    if (rule) {
      return {
        id: rule.id,
        name: rule.rule_name,
        status: rule.is_active,
        counter: '5人',
        code: rule.code,
        icon: config.icon,
        iconName: config.iconName,
        handler: config.handler,
      };
    }
    return {
      id: config.code,
      name: '',
      status: false,
      counter: '',
      code: config.code,
      icon: config.icon,
      iconName: config.iconName,
      handler: config.handler,
    };
  });

  const CAMERA_LIST: CameraListItem[] = [
    ...cameraListWithIcons,
    {
      ...livingItem,
      icon: IconLive,
      iconName: 'IconLive',
      handler: handleCameraPress,
      counter: `${countDetection}件`,
    },
    {
      id: '6',
      name: '人物登録',
      status: true,
      counter: `${countFace}人`,
      icon: IconListFace,
      iconName: 'IconListFace',
      handler: goToFaceUpload,
    },
  ];

  const fetchMembers = useCallback(async () => {
    try {
      const response = await faceService.getMembers();
      if (response.success) {
        setCountFace(response.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const handleSetupDetectionZone = () => {
    navigation.navigate('SettingAI', {
      camera: camera,
    });
  };

  const getCameraListItemPressHandler = (item: any, idx: number) => {
    if (item.handler) {
      if (item.handler === goToFaceUpload) return goToFaceUpload;
      return () => item.handler(item.name, item.iconName);
    }
    if (idx === 3) return handleCameraPress;
    return () => handlePressNotification(item.name, ICON_NAMES[idx]);
  };

  const filters =
    modes.length > 0
      ? modes.map((mode, idx) => ({
          name: mode.name_trans,
          description: mode.description_trans,
          iconActive: MODE_ICONS[idx]?.iconActive || IconWarningActive,
          iconUnActive: MODE_ICONS[idx]?.iconUnActive || IconWarningUnActive,
        }))
      : [
          {
            name: t('detail.alertMode'),
            description: t('detail.textNotification'),
            iconActive: IconWarningActive,
            iconUnActive: IconWarningUnActive,
          },
          {
            name: t('detail.safeMode'),
            description: t('detail.textNotification'),
            iconActive: IconSafeActive,
            iconUnActive: IconSafeUnActive,
          },
          {
            name: t('detail.releaseMode'),
            description: t('detail.textNotification'),
            iconActive: IconUnlockActive,
            iconUnActive: IconUnlockUnActive,
          },
        ];

  const handleUpdateMode = async (modeId: string) => {
    try {
      const response = await cameraService.updateCamera(camera.id, modeId);
      console.log(response);
      getDetail();
    } catch (err) {
      console.warn('Failed to update camera mode:', err);
    }
  };

  const handleTabPress = (idx: number, modeId: string) => {
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
          onPress: () => handleUpdateMode(modeId),
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (camera.id) {
      getCountDetection();
      intervalId = setInterval(getCountDetection, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [camera.id, getCountDetection]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={activeIndex !== null ? backgrounds[activeIndex] : backgrounds[0]}
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
                {activeIndex !== null &&
                  filters.map((filter, idx) => {
                    const Icon = activeIndex === idx ? filter.iconActive : filter.iconUnActive;
                    const modeId = modes[idx]?.id;
                    return (
                      <TouchableOpacity
                        key={filter.name}
                        style={[
                          styles.filterBtn,
                          activeIndex === idx && styles.activeFilterBtn,
                          activeIndex === idx && styles.filterBtnActiveWarning,
                        ]}
                        onPress={() => handleTabPress(idx, modeId)}
                      >
                        <Icon />
                        <Text style={styles.filterText}>{filter.name}</Text>
                        <Text style={styles.filterSmall}>{filter.description}</Text>
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
                      {item.icon ? (
                        // eslint-disable-next-line react-native/no-inline-styles
                        <View style={{ marginRight: 8 }}>
                          {React.createElement(item.icon, {
                            width: 24,
                            height: 24,
                            style: !item.status ? styles.disableIcon : undefined,
                          })}
                        </View>
                      ) : (
                        ICONS[idx] && (
                          // eslint-disable-next-line react-native/no-inline-styles
                          <View style={{ marginRight: 8 }}>
                            {React.createElement(ICONS[idx], {
                              width: 24,
                              height: 24,
                              style: !item.status ? styles.disableIcon : undefined,
                            })}
                          </View>
                        )
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
