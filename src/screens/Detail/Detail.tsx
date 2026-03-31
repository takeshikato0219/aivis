import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { styles } from './Detail.styles';

import BackIcon from '@assets/svg/icon-back.svg';
import SettingsIcon from '@assets/svg/icon-setting.svg';
import LogoDetail from '@assets/svg/logo-detail.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import RetangleImage from '@assets/png/rectangle-home.png';
import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconLive from '@assets/svg/icon-live.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import IconListFace from '@assets/svg/icon-list-face.svg';
import IconBan from '@assets/svg/ban-sign-icon.svg';
import IconAttendance from '@assets/svg/attendance-icon.svg';
import IconHelmet from '@assets/svg/helmet-icon.svg';
import IconMark from '@assets/svg/face-mask-icon.svg';
import IconGlove from '@assets/svg/gloves-icon.svg';
import IconVip from '@assets/svg/vip-label-icon.svg';

import { DetailScreenNavigationProp, DetailScreenRouteProp } from '@navigation/types';
import { COLORS } from '@constants/theme';
import rulesService from '@/services/rulesService';
import cameraService from '@/services/cameraService';
import faceService from '@/services/faceService';
import detectionZoneService from '@/services/detectionZone';
import {
  applyCountIncrements,
  subscribeCountDetectionEvent,
} from '@/services/countDetectionEventService';

import { MODE_BACKGROUNDS, MODE_ICONS, RULE_CONFIGS_BY_WORKFLOW } from './Detail.constants';
import {
  isAttendanceSubcounts,
  isEnterpriseAttendanceInOut,
  type CameraListItem,
  type CountDetectionData,
  type FilterItem,
  type RuleConfig,
  type WorkflowType,
} from './Detail.types';

const ICONS = [
  IconHome,
  IconPerson,
  IconSuspect,
  IconLive,
  IconBear,
  IconListFace,
  IconMark,
  IconGlove,
  IconBan,
  IconAttendance,
  IconHelmet,
  IconVip,
];
const ICON_NAMES = [
  'IconHome',
  'IconPerson',
  'IconSuspect',
  'IconLive',
  'IconBear',
  'IconListFace',
  'IconMark',
  'IconGlove',
  'IconBan',
  'IconAttendance',
  'IconHelmet',
  'IconVip',
];

const LIVING_ITEM_BASE = { id: '4', name: 'ライブカメラ', status: true, counter: '1' };

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const getWorkflowType = (workflowName: string): WorkflowType => {
  if (workflowName === 'Store') return 'Store';
  if (workflowName === 'Enterprise') return 'Enterprise';
  return 'Family';
};

const getCounterText = (
  code: string,
  workflowType: WorkflowType,
  data: CountDetectionData | null
): string => {
  const workflowCodes = RULE_CONFIGS_BY_WORKFLOW[workflowType].map((c) => c.code);
  if (!workflowCodes.includes(code) || !data) return '0人';

  if (code === 'home_return_count') {
    if (!('home_return_count' in data) || data.home_return_count == null) return '0人';
    const hr = data.home_return_count;
    return `${hr.current}/${hr.total}人`;
  }

  if (code === 'creature_detection') {
    if (!('creature_detection' in data)) return '0人';
    return `${data.creature_detection ?? 0}`;
  }

  if (code === 'attendance') {
    if (!('attendance' in data) || data.attendance == null) return '0人';
    const a = data.attendance;
    if (isAttendanceSubcounts(a)) {
      return '';
    }
    if (typeof a === 'number') {
      return `${a}人`;
    }
    return '0人';
  }

  if (code === 'enterprise_attendance') {
    if (!('enterprise_attendance' in data) || data.enterprise_attendance == null) return '0人';
    const ea = data.enterprise_attendance;
    if (isEnterpriseAttendanceInOut(ea)) {
      return '';
    }
    if (typeof ea === 'number') {
      return `${ea}人`;
    }
    return '0人';
  }

  const record = data as Record<string, unknown>;
  if (!(code in record)) return '0人';
  const raw = record[code];
  if (typeof raw === 'number') {
    return `${raw}人`;
  }
  return '0人';
};

const buildRuleConfigs = (
  workflowType: WorkflowType,
  handlers: {
    notification: (itemName: string, iconName: string, code: string) => void;
    customerReport: (itemName: string, iconName: string) => void;
    restrictedZone: () => void;
  }
): RuleConfig[] => {
  const configs = RULE_CONFIGS_BY_WORKFLOW[workflowType];
  return configs.map(({ code, icon, iconName, handlerType }) => {
    let handler: RuleConfig['handler'];
    if (handlerType === 'notification') {
      handler = (name: string, iconParam: string) => handlers.notification(name, iconParam, code);
    } else if (handlerType === 'customerReport') {
      handler = (name: string, iconParam: string) => handlers.customerReport(name, iconParam);
    } else if (handlerType === 'restrictedZone') {
      handler = handlers.restrictedZone;
    } else {
      handler = '';
    }
    return { code, icon, iconName, handler };
  });
};

const Detail = () => {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const route = useRoute<DetailScreenRouteProp>();
  const { t } = useTranslation();
  const camera = route.params?.camera;
  const workflowStatuses = route.params?.workflowStatuses;
  const title = camera?.name || 'Detail';

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lastFrameUri, setLastFrameUri] = useState<string | null>(null);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [detailModeId, setDetailModeId] = useState<string | null>(null);
  const [countFace, setCountFace] = useState<number>(0);
  const [countDetectionData, setCountDetectionData] = useState<CountDetectionData | null>(null);
  const [livePersonCount, setLivePersonCount] = useState<number | null>(null);

  let facilityId;
  if (camera?.facility_id != null) {
    facilityId = camera.facility_id;
  } else if ((camera as any)?.facility?.id != null) {
    facilityId = (camera as any).facility.id;
  } else {
    facilityId = undefined;
  }
  const matchedWorkflow = workflowStatuses?.find((ws) => String(ws.id) === String(facilityId));
  const workflowName = matchedWorkflow?.name ?? '';
  const workflowType = getWorkflowType(workflowName);

  const handleCameraPress = () => {
    navigation.navigate('CameraLive', {
      cameraId: camera.id,
      cameraName: camera.name,
    });
  };

  const handlePressNotification = (itemName: string, iconName: string, code: string) => {
    navigation.navigate('ListNotificationCamera', {
      title: itemName,
      icon: iconName,
      code,
      cameraId: camera.id,
    });
  };

  const handlePressCustomerReport = (itemName: string, iconName: string) => {
    navigation.navigate('CustomerReport', { title: itemName, icon: iconName, cameraId: camera.id });
  };

  const goToFaceUpload = () => {
    navigation.navigate('ListFace', { type: '' });
  };

  const handleSetupDetectionZone = () => {
    navigation.navigate('SettingAI', { camera });
  };

  const handleRestrictedZoneSetup = useCallback(async () => {
    try {
      const [liveRes, typeRes] = await Promise.all([
        cameraService.getLiveStreamUrl(camera.id),
        detectionZoneService.getType(),
      ]);
      const typeId = typeRes.data[1]?.id;
      if (!typeId) return;
      navigation.navigate('DetectionZoneSetup', {
        camera,
        zoneType: 'restricted',
        typeId,
        liveUrl: liveRes.data.live_url,
      });
    } catch (err) {
      console.warn('Failed to open restricted zone setup:', err);
    }
  }, [camera, navigation]);

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
      if (response.success && response.data) {
        setCountDetectionData(response.data);
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
            setLastFrameUri(exists ? `file://${savedPath}?t=${Date.now()}` : null);
          } else {
            setLastFrameUri(null);
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

  const ruleConfigs = buildRuleConfigs(workflowType, {
    notification: handlePressNotification,
    customerReport: handlePressCustomerReport,
    restrictedZone: handleRestrictedZoneSetup,
  });

  const cameraListWithIcons: CameraListItem[] = ruleConfigs.map((config) => {
    const rule = rulesList.find((r) => r.code === config.code);
    const counterText = getCounterText(config.code, workflowType, countDetectionData);
    const att = countDetectionData?.attendance;
    const ea = countDetectionData?.enterprise_attendance;
    const attendanceSub =
      config.code === 'attendance' && isAttendanceSubcounts(att)
        ? att
        : config.code === 'enterprise_attendance' && isEnterpriseAttendanceInOut(ea)
          ? ea
          : undefined;
    const displayName = rule?.rule_name ?? '';
    const baseItem = {
      counter: counterText,
      ...(attendanceSub ? { attendanceSub } : {}),
      code: config.code,
      icon: config.icon,
      iconName: config.iconName,
      handler: config.handler,
    };
    if (rule) {
      return {
        id: rule.id,
        name: displayName,
        status: rule.is_active,
        ...baseItem,
      };
    }
    return {
      id: config.code,
      name: displayName,
      status: false,
      ...baseItem,
    };
  });

  const liveCameraWsUrl =
    typeof countDetectionData?.people_count_ws_url === 'string' &&
    countDetectionData.people_count_ws_url.startsWith('wss://')
      ? countDetectionData.people_count_ws_url
      : null;

  let displayLiveCount: number;
  if (livePersonCount !== null) {
    displayLiveCount = livePersonCount;
  } else if (typeof countDetectionData?.people_count_ws_url === 'number') {
    displayLiveCount = countDetectionData.people_count_ws_url;
  } else {
    displayLiveCount = 0;
  }

  const iconLiveItem: CameraListItem = {
    ...LIVING_ITEM_BASE,
    icon: IconLive,
    iconName: 'IconLive',
    handler: handleCameraPress,
    counter: `${displayLiveCount}人`,
  };

  const creatureDetectionIdx = cameraListWithIcons.findIndex((item) => item.icon === IconBear);
  const cameraListWithIconsWithLive: CameraListItem[] =
    workflowType === 'Enterprise'
      ? [iconLiveItem, ...cameraListWithIcons]
      : creatureDetectionIdx !== -1
        ? [
            ...cameraListWithIcons.slice(0, creatureDetectionIdx),
            iconLiveItem,
            ...cameraListWithIcons.slice(creatureDetectionIdx),
          ]
        : [...cameraListWithIcons, iconLiveItem];

  const CAMERA_LIST: CameraListItem[] = [
    ...cameraListWithIconsWithLive,
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

  const getCameraListItemPressHandler = (item: CameraListItem, idx: number) => {
    if (item.handler) {
      if (item.handler === goToFaceUpload) return goToFaceUpload;
      if (item.handler === handleCameraPress) return handleCameraPress;
      if (item.handler === handleRestrictedZoneSetup) return handleRestrictedZoneSetup;
      if (typeof item.handler === 'function') {
        return () =>
          (item.handler as (itemName: string, iconName: string) => void)(
            item.name,
            item.iconName ?? ''
          );
      }
    }
    if (idx === 3) return handleCameraPress;
    return () => handlePressNotification(item.name, ICON_NAMES[idx], item.code ?? '');
  };

  const statusText =
    camera?.status == null
      ? 'Offline'
      : typeof camera.status === 'object'
        ? camera.status.name_trans
        : camera.status || 'Online';

  const filters: FilterItem[] =
    modes.length > 0
      ? modes.map((mode, idx) => ({
          name: mode.name_trans,
          description: mode.description_trans,
          iconActive: MODE_ICONS[idx]?.iconActive ?? MODE_ICONS[0].iconActive,
          iconUnActive: MODE_ICONS[idx]?.iconUnActive ?? MODE_ICONS[0].iconUnActive,
        }))
      : [
          {
            name: t('detail.alertMode'),
            description: t('detail.textNotification'),
            iconActive: MODE_ICONS[0].iconActive,
            iconUnActive: MODE_ICONS[0].iconUnActive,
          },
          {
            name: t('detail.safeMode'),
            description: t('detail.textNotification'),
            iconActive: MODE_ICONS[1].iconActive,
            iconUnActive: MODE_ICONS[1].iconUnActive,
          },
          {
            name: t('detail.releaseMode'),
            description: t('detail.textNotification'),
            iconActive: MODE_ICONS[2].iconActive,
            iconUnActive: MODE_ICONS[2].iconUnActive,
          },
        ];

  const handleUpdateMode = async (modeId: string) => {
    try {
      await cameraService.updateCamera(camera.id, modeId);
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
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), onPress: () => handleUpdateMode(modeId) },
      ],
      { cancelable: true }
    );
  };

  useFocusEffect(
    useCallback(() => {
      getCountDetection();
    }, [getCountDetection])
  );

  useEffect(() => {
    return subscribeCountDetectionEvent((payload) => {
      const cameraId = camera?.id != null ? String(camera.id) : undefined;
      if (payload.camera_id && cameraId && payload.camera_id !== cameraId) return;
      setCountDetectionData((prev) => applyCountIncrements(prev, payload.codes));
    });
  }, [camera?.id]);

  useEffect(() => {
    if (!liveCameraWsUrl) {
      setLivePersonCount(null);
      return;
    }
    let ws: WebSocket | null = null;
    const connect = () => {
      ws = new WebSocket(liveCameraWsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === 'person_count' && typeof data.person_count === 'number') {
            setLivePersonCount(data.person_count);
          }
        } catch {
          // ignore parse errors
        }
      };
      ws.onerror = () => ws?.close();
      ws.onclose = () => {
        ws = null;
      };
    };
    connect();
    return () => {
      ws?.close();
      setLivePersonCount(null);
    };
  }, [liveCameraWsUrl]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={activeIndex !== null ? MODE_BACKGROUNDS[activeIndex] : MODE_BACKGROUNDS[0]}
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
              <TouchableOpacity onPress={handleCameraPress}>
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
                        {
                          backgroundColor:
                            statusText.toLowerCase().includes('online') ||
                            statusText.toLowerCase().includes('オンライン')
                              ? COLORS.FF0000
                              : COLORS.gray696969,
                        },
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
              <View key={String(item.id)}>
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
                        {item.attendanceSub ? (
                          <View style={styles.attendanceCounterBlock}>
                            {isEnterpriseAttendanceInOut(item.attendanceSub) ? (
                              <>
                                <Text
                                  style={[
                                    styles.filterText,
                                    styles.attendanceCounterLine,
                                    !item.status && styles.disableText,
                                  ]}
                                >
                                  {t('detail.checkin')}: {item.attendanceSub.in}人
                                </Text>
                                <Text
                                  style={[
                                    styles.filterText,
                                    styles.attendanceCounterLine,
                                    !item.status && styles.disableText,
                                  ]}
                                >
                                  {t('detail.checkout')}: {item.attendanceSub.out}人
                                </Text>
                              </>
                            ) : (
                              <>
                                <Text
                                  style={[
                                    styles.filterText,
                                    styles.attendanceCounterLine,
                                    !item.status && styles.disableText,
                                  ]}
                                >
                                  {t('detail.checkin')}: {item.attendanceSub.checkin}人
                                </Text>
                                <Text
                                  style={[
                                    styles.filterText,
                                    styles.attendanceCounterLine,
                                    !item.status && styles.disableText,
                                  ]}
                                >
                                  {t('detail.checkout')}: {item.attendanceSub.checkout}人
                                </Text>
                              </>
                            )}
                          </View>
                        ) : (
                          <Text style={[styles.filterText, !item.status && styles.disableText]}>
                            {item.counter}
                          </Text>
                        )}
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
