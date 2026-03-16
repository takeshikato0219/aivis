import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppSelector } from '@redux/store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './Home.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@constants/theme';
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
import IconBlue from '@assets/svg/icon-blue.svg';
import cameraService from '@api/cameraService';
import { Camera, WorkflowStatus } from '@api/types/cameraTypes';
import { useErrorHandler } from '@hooks/useErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import notificationsService from '@api/notificationsService';

const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAppSelector((state) => state.auth);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isPad = Platform.OS === 'ios' && width >= 768;
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const avatarUrl = user?.avatar_url;
  const [avatarError, setAvatarError] = useState(false);
  const [cameraList, setCameraList] = useState<Camera[]>([]);
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const { handleError } = useErrorHandler();
  const currentPageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [hasCamerasInAllTab, setHasCamerasInAllTab] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFrameUris, setLastFrameUris] = useState<{ [cameraId: string]: string | null }>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // USING COMMON HOOKS
  const { syncUserData } = useUserSync();
  useAppSetup({ screenName: 'Home' });

  // Initial load
  useEffect(() => {
    fetchWorkflowStatuses();
    // Initial load will be handled by the filter change effect when statuses are loaded
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      syncUserData();
    }
  }, [isDrawerOpen, syncUserData]);

  const fetchCameraList = useCallback(
    async (append: boolean = false, facilityId: string | null = null) => {
      if (!append) {
        setIsLoadingCameras(true);
      }

      try {
        const pageToFetch = append ? currentPageRef.current + 1 : 1;

        const response = await cameraService.getCameras({
          sort_by: 'created_at',
          sort_order: 'desc',
          page: pageToFetch,
          per_page: 20,
          facility_id: facilityId || undefined,
        });
        const newData = response.data || [];
        if (facilityId === null) {
          setHasCamerasInAllTab(newData.length > 0);
        }

        if (append) {
          setCameraList((prev) => [...prev, ...newData]);
          currentPageRef.current = pageToFetch;
        } else {
          setCameraList(newData);
          currentPageRef.current = 1;
          setHasMore(true);
        }

        if (response.total_pages !== undefined) {
          setHasMore(pageToFetch < response.total_pages);
        } else {
          setHasMore(newData.length >= 20);
        }
      } catch (error: any) {
        console.error('Error fetching camera list:', error);
        handleError(error, false);
        if (!append) {
          setCameraList([]);
        }
      } finally {
        if (!append) {
          setIsLoadingCameras(false);
        }
      }
    },
    [handleError]
  );

  const fetchWorkflowStatuses = async () => {
    try {
      setIsLoadingStatuses(true);
      const response = await cameraService.getWorkflowStatuses();
      setWorkflowStatuses(response.data || []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setWorkflowStatuses([]);
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  const getStatusDisplayName = (
    status: WorkflowStatus | { id: string; name_trans: string }
  ): string => {
    return status.name_trans || (status as WorkflowStatus).name || '';
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchWorkflowStatuses();
      setIsLoadingMore(true);
      fetchCameraList(true, selectedFacilityId).finally(() => {
        setIsLoadingMore(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, hasMore, selectedFacilityId]);

  useEffect(() => {
    if (isLoadingStatuses) {
      return;
    }

    if (activeIndex === 0) {
      setSelectedFacilityId(null);
      fetchCameraList(false, null);
    } else {
      const statusIndex = activeIndex - 1;
      if (workflowStatuses[statusIndex]) {
        const facilityId = workflowStatuses[statusIndex].id;
        setSelectedFacilityId(facilityId);
        fetchCameraList(false, facilityId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isLoadingStatuses]);

  const goToDetail = (camera: Camera) => {
    navigation.navigate('Detail', {
      camera: camera,
      workflowStatuses: workflowStatuses,
    });
  };

  const goToBluetoothScan = () => {
    navigation.navigate('ConnectDevice' as never);
  };

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsService.getNotifications({
        is_seen: false,
        user_id: user?.id,
      });
      const unread = response.meta.total;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCameraList(false, selectedFacilityId);
    setIsRefreshing(false);
  }, [fetchCameraList, selectedFacilityId]);

  // Load last frame URIs for all cameras
  const loadLastFrames = useCallback(async (cameras: Camera[]) => {
    const uris: { [cameraId: string]: string | null } = {};
    for (const camera of cameras) {
      try {
        const savedPath = await AsyncStorage.getItem(`camera_last_frame_${camera.id}`);
        if (savedPath) {
          const exists = await RNFS.exists(savedPath);
          if (exists) {
            uris[camera.id] = `file://${savedPath}?t=${Date.now()}`;
          } else {
            uris[camera.id] = null;
          }
        } else {
          uris[camera.id] = null;
        }
      } catch {
        uris[camera.id] = null;
      }
    }
    setLastFrameUris(uris);
  }, []);

  // Load last frames when cameraList changes or Home regains focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      if (cameraList.length > 0) {
        loadLastFrames(cameraList);
      } else {
        setLastFrameUris({});
      }
    }, [cameraList, loadLastFrames, loadNotifications])
  );

  const renderCameraContent = () => {
    if (isLoadingCameras) {
      return (
        <View style={styles.styleEmptyList}>
          <ActivityIndicator size="large" color="#00ADD4" />
        </View>
      );
    }

    if (cameraList.length > 0) {
      return (
        <ScrollView
          style={styles.cameraListScroll}
          contentContainerStyle={styles.paddingScrollView}
          showsVerticalScrollIndicator={true}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            if (isCloseToBottom && hasMore && !isLoadingMore) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {cameraList.map((camera) => {
            const statusText =
              camera.status == null
                ? 'Offline'
                : typeof camera.status === 'object'
                  ? camera.status.name_trans
                  : camera.status || 'Online';

            const isOnline =
              statusText.toLowerCase().includes('online') ||
              statusText.toLowerCase().includes('オンライン');

            const lastFrameUri = lastFrameUris[camera.id] || null;

            return (
              <TouchableOpacity onPress={() => goToDetail(camera)} key={camera.id}>
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
                  <View style={styles.rowCenter}>
                    <Text style={styles.cardText}>{camera.name}</Text>
                    <View style={styles.iconCircle}>
                      <MoveRightIconCircle />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {isLoadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#00ADD4" />
            </View>
          )}
        </ScrollView>
      );
    }

    if (activeIndex === 0) {
      return (
        <View style={styles.styleEmptyList}>
          <CleanShotIcon />
          <Text style={styles.textStyleReady}>{t('home.readyToPair')}</Text>
          <View style={styles.styleViewCameraAndEnsure}>
            <IconBlue />
            <Text style={styles.textCameraAndEnsure}>{t('home.cameraAndEnsure')}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.styleEmptyList}>
        <Text style={styles.textStyleReady}>{t('home.noData')}</Text>
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchCameraList(false, selectedFacilityId);
    }, [selectedFacilityId, fetchCameraList])
  );

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
          <View style={styles.mainContainer}>
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
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications', { userId: user?.id })}
                  style={styles.iconBtn}
                >
                  <View>
                    <BellIcon />
                    {unreadCount > 0 && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeTextNoti}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.iconBtn}>
                  <MenuIcon />
                </TouchableOpacity>
              </View>
            </View>
            {(cameraList.length > 0 || hasCamerasInAllTab) && (
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
                {!isLoadingStatuses && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterRow}
                  >
                    <TouchableOpacity
                      key="all"
                      style={[styles.filterBtn, activeIndex === 0 && styles.activeFilterBtn]}
                      onPress={() => setActiveIndex(0)}
                    >
                      <Text style={styles.filterText}>{t('home.all')}</Text>
                    </TouchableOpacity>
                    {workflowStatuses.map((status, idx) => (
                      <TouchableOpacity
                        key={status.id}
                        style={[
                          styles.filterBtn,
                          activeIndex === idx + 1 && styles.activeFilterBtn,
                        ]}
                        onPress={() => setActiveIndex(idx + 1)}
                      >
                        <Text style={styles.filterText}>{getStatusDisplayName(status)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {renderCameraContent()}
          </View>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={goToBluetoothScan}
            activeOpacity={0.8}
          >
            <View style={styles.centerButton}>
              <Icon name="plus" size={32} color="#ccc" />
              <Text style={styles.manualButtonText}>{t('home.addCamera')}</Text>
            </View>
          </TouchableOpacity>
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
