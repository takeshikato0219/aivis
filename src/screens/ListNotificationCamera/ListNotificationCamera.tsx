import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Pressable,
  ImageBackground,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackIcon from '@assets/svg/icon-back.svg';
import Video from 'react-native-video';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import IconCCTV from '@assets/svg/icon-cctv.svg';
import { Calendar } from 'react-native-calendars';
import BackgroundNofication from '@assets/png/background-notification.png';
import { styles } from './ListNotificationCamera.style';
import { useTranslation } from 'react-i18next';
import { AppStackParamList } from '@navigation/types';
import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconLive from '@assets/svg/icon-live.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import IconListFace from '@assets/svg/icon-list-face.svg';
import notificationsService, { Detection } from '@/services/notificationsService';
import LoadingComponent from '@components/Loading/Loading';
import IconMark from '@assets/svg/face-mask-icon.svg';
import IconGlove from '@assets/svg/gloves-icon.svg';
import IconBan from '@assets/svg/ban-sign-icon.svg';
import IconAttendance from '@assets/svg/attendance-icon.svg';
import IconHelmet from '@assets/svg/helmet-icon.svg';
import IconVip from '@assets/svg/vip-label-icon.svg';

interface NotificationItem {
  id: string;
  notification_message: string;
  date: string;
  time: string;
  thumbnail: string;
  videoUrl?: string;
  imageUrl?: string;
}

const ICON_MAP: Record<string, React.FC<any>> = {
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
};

interface VideoStateComponentProps {
  videoUrl: string | null;
  imageUrl: string | null;
  t: (key: string) => string;
}
const VideoStateComponent: React.FC<VideoStateComponentProps> = ({ videoUrl, imageUrl, t }) => {
  const renderContent = () => {
    if (videoUrl) {
      return (
        <View style={styles.videoFullContainer}>
          <Video
            source={{ uri: videoUrl }}
            style={styles.videoFullPlayer}
            controls
            resizeMode="cover"
            paused={false}
          />
        </View>
      );
    }

    if (imageUrl) {
      return (
        <View style={styles.videoFullContainer}>
          <Image source={{ uri: imageUrl }} style={styles.videoFullPlayer} resizeMode="contain" />
        </View>
      );
    }

    return (
      <>
        <View style={styles.emptyIcon}>
          <IconCCTV />
        </View>
        <Text style={styles.emptyText}>{t('listNotificationCamera.tapTheListBelowToView')}</Text>
      </>
    );
  };

  return <View style={styles.emptyState}>{renderContent()}</View>;
};

const mapDetectionToNotificationItem = (d: Detection): NotificationItem => {
  const [datePart, timePart] = d.detected_at.split('T');
  const time = timePart ? timePart.slice(0, 5) : '00:00';
  return {
    id: d.id,
    notification_message: d.notification_message || '',
    date: datePart,
    time,
    thumbnail: d.image_url,
    imageUrl: d.image_url,
  };
};

const PAGE_SIZE = 15;

const ListNotificationCamera = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [listData, setListData] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'ListNotificationCamera'>>();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => {
    return route.params?.detected_at || new Date().toISOString().slice(0, 10);
  });
  const HeaderIcon = ICON_MAP[route.params?.icon] || Icon;
  const eventType = route.params?.code;
  const cameraId = route.params?.cameraId;

  const handleList = useCallback(
    async (pageToLoad = 1, isReload = false) => {
      if (!cameraId || !eventType) return;
      if (isReload) {
        setRefreshing(true);
      } else if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const response = await notificationsService.getNotificationWithType(
          cameraId,
          eventType,
          selectedDate,
          { page: pageToLoad, per_page: PAGE_SIZE }
        );
        if (response.success && response.data) {
          const newItems = response.data.map(mapDetectionToNotificationItem);
          if (isReload || pageToLoad === 1) {
            setListData(newItems);
          } else {
            setListData((prev) => [...prev, ...newItems]);
          }
          const meta = response.meta;
          setHasMore(meta != null ? pageToLoad < meta.total_pages : false);
          setPage(pageToLoad);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (isReload || pageToLoad === 1) setListData([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [cameraId, eventType, selectedDate]
  );

  useEffect(() => {
    handleList(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId, eventType, selectedDate]);

  const onRefresh = useCallback(() => {
    handleList(1, true);
  }, [handleList]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && listData.length > 0) {
      handleList(page + 1, false);
    }
  }, [loading, loadingMore, hasMore, page, handleList, listData.length]);

  const handleItemPress = (item: NotificationItem) => {
    if (item.videoUrl) {
      setSelectedVideo(item.videoUrl);
      setSelectedImage(null);
    } else if (item.imageUrl) {
      setSelectedImage(item.imageUrl);
      setSelectedVideo(null);
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const hasVideo = !!item.videoUrl;

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <View style={styles.textContent}>
            <Text style={styles.notificationTitle}>{item.notification_message}</Text>
            <Text style={styles.notificationDate}>
              {item.date} {item.time}
            </Text>
          </View>
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            {hasVideo && (
              <View style={styles.playButton}>
                <Icon name="play" size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredData = listData.filter((item) => item.date === selectedDate);

  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreFooter}>
        <ActivityIndicator size="small" color="#2196f3" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <HeaderIcon width={32} height={32} color="#fff" />
          <Text style={styles.headerText}>{route.params?.title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      <VideoStateComponent videoUrl={selectedVideo} imageUrl={selectedImage} t={t} />
      <View style={styles.dateSectionWrapper}>
        <ImageBackground
          source={BackgroundNofication}
          style={styles.backgroundImage}
          resizeMode="stretch"
          imageStyle={styles.imageStyle}
        >
          <View style={styles.contentAboveBg}>
            <View style={styles.dateHeader}>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() - 1);
                  const newDate = date.toISOString().slice(0, 10);
                  setSelectedDate(newDate);
                  setSelectedVideo(null);
                  setSelectedImage(null);
                }}
                style={styles.dateIconBtn}
              >
                <Icon name="chevron-left" size={16} color="#666" />
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setShowCalendarModal(true)}
                style={styles.dateTextBtn}
              >
                <Text style={styles.dateText}>{selectedDate.replace(/-/g, '/')}</Text>
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() + 1);
                  const newDate = date.toISOString().slice(0, 10);
                  setSelectedDate(newDate);
                  setSelectedVideo(null);
                  setSelectedImage(null);
                }}
                style={styles.dateIconBtn}
              >
                <Icon name="chevron-right" size={16} color="#666" />
              </Pressable>
            </View>
            {loading && page === 1 && <LoadingComponent />}
            <FlatList
              data={filteredData}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              style={styles.notificationList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196f3" />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderListFooter}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>{t('home.noData')}</Text>
                  </View>
                ) : null
              }
            />
            <Modal
              visible={showCalendarModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendarModal(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setShowCalendarModal(false)}>
                <Pressable style={styles.calendarModalContent} onPress={() => {}}>
                  <Calendar
                    current={selectedDate}
                    onDayPress={(day: { dateString: string }) => {
                      setSelectedDate(day.dateString);
                      setSelectedVideo(null);
                      setSelectedImage(null);
                      setShowCalendarModal(false);
                    }}
                    markedDates={{
                      [selectedDate]: { selected: true, selectedColor: '#2196f3' },
                    }}
                    theme={{
                      backgroundColor: '#222',
                      calendarBackground: '#222',
                      dayTextColor: '#fff',
                      monthTextColor: '#fff',
                      selectedDayBackgroundColor: '#2196f3',
                      selectedDayTextColor: '#fff',
                      todayTextColor: '#2196f3',
                      arrowColor: '#fff',
                    }}
                    style={styles.calendarStyle}
                  />
                  <TouchableOpacity
                    style={styles.closeCalendarBtn}
                    onPress={() => setShowCalendarModal(false)}
                  >
                    <Text style={styles.closeCalendarText}>{t('listFace.close')}</Text>
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

export default ListNotificationCamera;
