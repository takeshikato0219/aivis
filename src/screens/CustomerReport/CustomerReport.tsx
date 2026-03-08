import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
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

const ICON_MAP: Record<string, React.FC<any>> = {
  IconHome,
  IconPerson,
  IconSuspect,
  IconLive,
  IconBear,
  IconListFace,
};

const CustomerReport = () => {
  const [selectedDate, setSelectedDate] = useState('2026-03-04');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'CustomerReport'>>();
  const HeaderIcon = ICON_MAP[route.params?.icon] || Icon;

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
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.pbScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={styles.viewStyle}>
            <View style={styles.styleCenterRow}>
              <IconMen />
              <Text style={styles.styleText}>男性</Text>
            </View>
            <Text style={styles.styleText}>25人</Text>
          </View>
          <View style={styles.viewChild}>
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
            <View style={styles.styleItem} />
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
            <View style={styles.styleItem} />
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
          </View>
          <View style={styles.viewItem2}>
            <View style={styles.styleCenterRow}>
              <IconWomen />
              <Text style={styles.styleText}>女性</Text>
            </View>
            <Text style={styles.styleText}>25人</Text>
          </View>
          <View style={styles.viewChild}>
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
            <View style={styles.styleItem} />
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
            <View style={styles.styleItem} />
            <View style={styles.viewItem}>
              <Text style={styles.styleTextCenter}>30歳未満</Text>
              <Text style={styles.styleTextCenter}>25人</Text>
            </View>
          </View>
        </View>
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
              <Text style={styles.closeCalendarText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerReport;
