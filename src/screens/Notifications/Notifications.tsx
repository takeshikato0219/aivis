import React, { useEffect, useState, useCallback } from 'react';
import { View, ImageBackground, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Text, Card, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './Notifications.styles';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import notificationsService, { Notification } from '@/services/notificationsService';
import { appBadgeService } from '@/services/appBadgeService';
import { ScrollView } from 'react-native-gesture-handler';
import rulesService from '@/services/rulesService';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';

import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import LoadingComponent from '@components/Loading/Loading';

const PAGE_SIZE = 10;

const Notifications = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { t } = useTranslation();
  useAppSetup({ screenName: 'Notifications' });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const route = useRoute<RouteProp<AppStackParamList, 'Notifications'>>();
  const [rules, setRules] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const userId = route.params?.userId;

  const ruleIconMap: Record<string, { icon: any; iconName: string }> = {
    home_return_count: { icon: IconHome, iconName: 'IconHome' },
    daily_passerby: { icon: IconPerson, iconName: 'IconPerson' },
    unregistered_detection: { icon: IconSuspect, iconName: 'IconSuspect' },
    creature_detection: { icon: IconBear, iconName: 'IconBear' },
  };

  const defaultIcon = IconHome;
  const defaultIconName = 'IconHome';

  const getRulesMaster = async () => {
    try {
      const response = await rulesService.getRules();
      if (response.success && Array.isArray(response.data)) {
        setRules(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch rules:', err);
    }
  };

  const loadNotifications = useCallback(async (pageToLoad = 1, isReload = false) => {
    setLoading(true);
    try {
      const response = await notificationsService.getNotifications({
        page: pageToLoad,
        pageSize: PAGE_SIZE,
        user_id: userId,
      });
      let newData = Array.isArray(response.data) ? response.data : [];
      if (isReload) {
        setNotifications(newData);
      } else {
        setNotifications((prev) => [...prev, ...newData]);
      }
      setHasMore(newData.length === PAGE_SIZE);
      setPage(pageToLoad);
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (isReload) setNotifications([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.updateNotificationSeen(id, true);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_seen: true } : item))
      );
      if (Platform.OS === 'ios') {
        const currentBadge = await appBadgeService.getBadgeCount();
        await appBadgeService.setBadgeCount(Math.max(0, currentBadge - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    loadNotifications(1, true);
    getRulesMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      const syncBadge = async () => {
        if (!userId) {
          await appBadgeService.setBadgeCount(0);
          return;
        }
        try {
          const res = await notificationsService.getNotifications({
            is_seen: false,
            user_id: userId,
            per_page: 1,
            page: 1,
          });
          const unread = res.meta?.total ?? 0;
          await appBadgeService.setBadgeCount(unread);
        } catch {
          // ignore
        }
      };
      syncBadge();
    }, [userId])
  );

  const handleLoadMore = () => {
    setRefreshing(true);
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    loadNotifications(1, true);
  }, [loadNotifications]);

  const handleScroll = ({ nativeEvent }: { nativeEvent: any }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20 &&
      hasMore &&
      !loading
    ) {
      handleLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>

            <View style={styles.viewTitle}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {t('notifications.title')}
              </Text>
            </View>
          </View>
          {loading && <LoadingComponent />}
          <View style={styles.content}>
            {/* List */}
            <ScrollView
              style={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {Array.isArray(notifications) && notifications.length > 0 ? (
                notifications.map((item, idx) => {
                  const matchedRule = rules.find((rule) => rule.id === item.rules_master_id);
                  const isDailyPasserby = matchedRule && matchedRule.code === 'daily_passerby';
                  // Get iconName from ruleIconMap if available
                  const iconInfo =
                    matchedRule && matchedRule.code && ruleIconMap[matchedRule.code]
                      ? ruleIconMap[matchedRule.code]
                      : { icon: defaultIcon, iconName: defaultIconName };
                  const iconName = iconInfo.iconName;
                  const itemName = matchedRule?.rule_name || item.message;
                  const onPress = () => {
                    if (!item.is_seen) handleMarkAsRead(item.id);
                    if (isDailyPasserby) {
                      navigation.navigate('CustomerReport', { title: itemName, icon: iconName });
                    } else {
                      const dateValue = item.sent_at || item.created_at;
                      const detectedAt = dateValue
                        ? new Date(dateValue).toISOString().slice(0, 10)
                        : undefined;
                      navigation.navigate('ListNotificationCamera', {
                        title: itemName,
                        icon: iconName,
                        code: matchedRule?.code || '',
                        cameraId: item.camera_id,
                        detected_at: detectedAt,
                      });
                    }
                  };
                  return (
                    <Card
                      key={item.id ? `${item.id}-${idx}` : `notification-${idx}`}
                      style={[styles.notificationCard, !item.is_seen && styles.unreadCard]}
                      elevation={0}
                      onPress={onPress}
                    >
                      <Card.Content>
                        <List.Item
                          title={item.message}
                          description={
                            item.sent_at || item.created_at
                              ? new Date(item.sent_at || item.created_at).toLocaleString()
                              : ''
                          }
                          onPress={onPress}
                        />
                      </Card.Content>
                    </Card>
                  );
                })
              ) : (
                <View style={styles.noData}>
                  <Text>{t('home.noData')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
        {refreshing && <LoadingComponent />}
      </ImageBackground>
    </View>
  );
};

export default Notifications;
