import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import IconMen from '@assets/svg/icon-men.svg';
import IconWomen from '@assets/svg/icon-women.svg';
import { Calendar } from 'react-native-calendars';
import { styles } from './CustomerReport.style';
import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconLive from '@assets/svg/icon-live.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import IconListFace from '@assets/svg/icon-list-face.svg';
import { AppStackParamList } from '@navigation/types';
import cameraService from '@/services/cameraService';
import type { CustomerAttributeReportData } from '@api/types/cameraTypes';
import { useTranslation } from 'react-i18next';

const ICON_MAP: Record<string, React.FC<any>> = {
  IconHome,
  IconPerson,
  IconSuspect,
  IconLive,
  IconBear,
  IconListFace,
};

const CustomerReport = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'CustomerReport'>>();
  const cameraId = route.params?.cameraId;
  const [selectedDate, setSelectedDate] = useState(() => {
    return route.params?.detected_at || new Date().toISOString().slice(0, 10);
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [report, setReport] = useState<CustomerAttributeReportData | null>(null);
  const [loading, setLoading] = useState(!!cameraId);
  const HeaderIcon = ICON_MAP[route.params?.icon] || Icon;
  const { t } = useTranslation();

  useEffect(() => {
    if (!cameraId) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await cameraService.reportCustomer(cameraId, { date: selectedDate });
        if (!cancelled && response.success && response.data) {
          setReport(response.data);
        }
      } catch {
        if (!cancelled) {
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [cameraId, selectedDate]);

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
      <View style={styles.dateHeader}>
        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.pbScrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          // eslint-disable-next-line react-native/no-inline-styles
          <ActivityIndicator size="large" color="#2196f3" style={{ marginTop: 24 }} />
        ) : (
          <View>
            <View style={styles.viewStyle}>
              <View style={styles.styleCenterRow}>
                <IconMen />
                <Text style={styles.styleText}>{t('customerReport.male')}</Text>
              </View>
              <Text style={styles.styleText}>
                {t('customerReport.personCount', { count: report?.male?.total ?? 0 })}
              </Text>
            </View>
            <View style={styles.viewChild}>
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.ageUnder30')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.male?.age_groups?.under_30 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age30AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.male?.age_groups?.from_30_to_49 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age50AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.male?.age_groups?.above_50 ?? 0,
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.viewItem2}>
              <View style={styles.styleCenterRow}>
                <IconWomen />
                <Text style={styles.styleText}>{t('customerReport.female')}</Text>
              </View>
              <Text style={styles.styleText}>
                {t('customerReport.personCount', { count: report?.female?.total ?? 0 })}
              </Text>
            </View>
            <View style={styles.viewChild}>
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.ageUnder30')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.female?.age_groups?.under_30 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age30AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.female?.age_groups?.from_30_to_49 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age50AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.female?.age_groups?.above_50 ?? 0,
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.viewItem2}>
              <View style={styles.styleCenterRow}>
                <IconSuspect />
                <Text style={styles.styleText}>{t('customerReport.unknown')}</Text>
              </View>
              <Text style={styles.styleText}>
                {t('customerReport.personCount', { count: report?.unknown?.total ?? 0 })}
              </Text>
            </View>
            <View style={styles.viewChild}>
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.ageUnder30')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.unknown?.age_groups?.under_30 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age30AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.unknown?.age_groups?.from_30_to_49 ?? 0,
                  })}
                </Text>
              </View>
              <View style={styles.styleItem} />
              <View style={styles.viewItem}>
                <Text style={styles.styleTextCenter}>{t('customerReport.age50AndOver')}</Text>
                <Text style={styles.styleTextCenter}>
                  {t('customerReport.personCount', {
                    count: report?.unknown?.age_groups?.above_50 ?? 0,
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
              <Text style={styles.closeCalendarText}>{t('customerReport.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerReport;
