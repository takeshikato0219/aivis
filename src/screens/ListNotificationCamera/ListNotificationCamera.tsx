import React, { useState, useEffect } from 'react';
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
import notificationsService, { Detection } from '@api/notificationsService';

interface NotificationItem {
  id: string;
  title: string;
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
};

interface VideoStateComponentProps {
  videoUrl: string | null;
  imageUrl: string | null;
  t: (key: string) => string;
}
const VideoStateComponent: React.FC<VideoStateComponentProps> = ({ videoUrl, imageUrl, t }) => (
  <View style={styles.emptyState}>
    {videoUrl ? (
      <View style={styles.videoFullContainer}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.videoFullPlayer}
          controls
          resizeMode="cover"
          paused={false}
        />
      </View>
    ) : imageUrl ? (
      <View style={styles.videoFullContainer}>
        <Image source={{ uri: imageUrl }} style={styles.videoFullPlayer} resizeMode="contain" />
      </View>
    ) : (
      <>
        <View style={styles.emptyIcon}>
          <IconCCTV />
        </View>
        <Text style={styles.emptyText}>{t('listNotificationCamera.tapTheListBelowToView')}</Text>
      </>
    )}
  </View>
);

const mapDetectionToNotificationItem = (d: Detection): NotificationItem => {
  const [datePart, timePart] = d.detected_at.split('T');
  const time = timePart ? timePart.slice(0, 5) : '00:00'; // HH:MM
  return {
    id: d.id,
    title: d.event_type || '',
    date: datePart,
    time,
    thumbnail: d.image_url,
    imageUrl: d.image_url,
  };
};

const ListNotificationCamera = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [listData, setListData] = useState<NotificationItem[]>([]);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'ListNotificationCamera'>>();
  const { t } = useTranslation();
  const HeaderIcon = ICON_MAP[route.params?.icon] || Icon;
  const eventType = route.params?.code;
  const cameraId = route.params?.cameraId;

  useEffect(() => {
    handleList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId, eventType]);

  const handleList = async () => {
    if (!cameraId || !eventType) return;
    try {
      const response = await notificationsService.getNotificationWithType(cameraId, eventType);
      if (response.success && response.data) {
        setListData(response.data.map(mapDetectionToNotificationItem));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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
            <Text style={styles.notificationTitle}>{item.title}</Text>
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
                onPress={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() - 1);
                  const newDate = date.toISOString().slice(0, 10);
                  setSelectedDate(newDate);
                }}
                style={styles.dateIconBtn}
              >
                <Icon name="chevron-left" size={16} color="#666" />
              </Pressable>
              <Pressable onPress={() => setShowCalendarModal(true)} style={styles.dateTextBtn}>
                <Text style={styles.dateText}>{selectedDate.replace(/-/g, '/')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() + 1);
                  const newDate = date.toISOString().slice(0, 10);
                  setSelectedDate(newDate);
                }}
                style={styles.dateIconBtn}
              >
                <Icon name="chevron-right" size={16} color="#666" />
              </Pressable>
            </View>
            <FlatList
              data={filteredData}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              style={styles.notificationList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>{t('home.noData')}</Text>
                </View>
              }
            />
            <Modal
              visible={showCalendarModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendarModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.calendarModalContent}>
                  <Calendar
                    current={selectedDate}
                    onDayPress={(day: { dateString: string }) => {
                      setSelectedDate(day.dateString);
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
                </View>
              </View>
            </Modal>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

export default ListNotificationCamera;
