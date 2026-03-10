import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@hooks/useResponsive';
import { styles, CONTAINER_H_PADDING, CARD_PADDING } from './WorkSchedule.style';
import IconClockWorkSchedule from '@assets/svg/icon-clock-workschedule.svg';
import faceService, { Member } from '@api/faceService';
import DropDownPicker from 'react-native-dropdown-picker';
import BackIcon from '@assets/svg/icon-back.svg';
import { WorkScheduleRouteProp } from '@navigation/types';
import cameraService from '@api/cameraService';
import { showCommonAlert } from '@components/Alert/Alert';

type Weekday = {
  key: string;
  label: string;
};

type ScheduleConfig = {
  enabled: boolean;
  repeatDays: string[];
  startMinute: number;
  endMinute: number;
};

const WEEKDAYS: Weekday[] = [
  { key: 'mon', label: '月' },
  { key: 'tue', label: '火' },
  { key: 'wed', label: '水' },
  { key: 'thu', label: '木' },
  { key: 'fri', label: '金' },
  { key: 'sat', label: '土' },
  { key: 'sun', label: '日' },
];

// Move SaveButton to module scope
interface SaveButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  t: (key: string) => string;
}
const SaveButton = ({ style, onPress, t }: SaveButtonProps) => (
  <Pressable style={[styles.button, style]} onPress={onPress}>
    <Text style={styles.text}>{t('workSchedule.save')}</Text>
  </Pressable>
);

export default function WorkSchedule() {
  const { t } = useTranslation();
  const { width } = useResponsive();
  const [members, setMembers] = useState<Member[]>([]);
  const [openSelect2, setOpenSelect2] = useState(false);
  const [select2Value, setSelect2Value] = useState<string[]>([]);
  const [select2Items, setSelect2Items] = useState<{ label: string; value: string }[]>([]);
  const navigation = useNavigation();
  const route = useRoute<WorkScheduleRouteProp>();
  const camera = route.params?.camera;
  const ruleId = route.params?.ruleId;

  useEffect(() => {
    getSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSchedule = async () => {
    const response = await cameraService.getWorkScheduleForRule(camera.id, ruleId);
    if (response && response.data) {
      const data = response.data;
      const weekdayMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const repeatDays = Array.isArray(data.weekdays)
        ? data.weekdays.map((n: number) => weekdayMap[n - 1]).filter(Boolean)
        : [];
      function timeToMinutes(timeStr: string) {
        if (!timeStr) return 0;
        const [hh, mm] = timeStr.split(':').map(Number);
        return hh * 60 + mm;
      }
      setSchedule({
        enabled: data.is_active,
        repeatDays,
        startMinute: timeToMinutes(data.start_time),
        endMinute: timeToMinutes(data.end_time),
      });
      if (Array.isArray(data.member_ids)) {
        setSelect2Value(data.member_ids);
      }
    }
  };

  const sliderLength = useMemo(() => {
    const available = width - CONTAINER_H_PADDING * 2 - CARD_PADDING * 2;
    return Math.max(available - 16, 200);
  }, [width]);

  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: true,
    repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startMinute: 6 * 60,
    endMinute: 18 * 60,
  });
  const [saving, setSaving] = useState(false);

  const timeRangeText = useMemo(() => {
    function pad2(n: number) {
      return n < 10 ? `0${n}` : `${n}`;
    }
    function minuteToHHmm(min: number) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      return `${pad2(hh)}:${pad2(mm)}`;
    }
    return `${minuteToHHmm(schedule.startMinute)} - ${minuteToHHmm(schedule.endMinute)}`;
  }, [schedule.startMinute, schedule.endMinute]);

  const onToggleEnabled = useCallback(async (enabled: boolean) => {
    setSchedule((p) => ({ ...p, enabled }));
  }, []);

  const onToggleDay = useCallback(async (dayKey: string) => {
    setSchedule((prev) => {
      const exists = prev.repeatDays.includes(dayKey);
      const nextDays = exists
        ? prev.repeatDays.filter((d) => d !== dayKey)
        : [...prev.repeatDays, dayKey];

      return { ...prev, repeatDays: nextDays };
    });
  }, []);

  const onChangeTime = useCallback(async (values: number[]) => {
    const [startMinute, endMinute] = values;
    setSchedule((p) => ({ ...p, startMinute, endMinute }));
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await faceService.getMembers();
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const member_ids = select2Value;
      function minuteToTimeString(min: number) {
        const clampedMin = Math.max(0, Math.min(min, 1439));
        const hh = Math.floor(clampedMin / 60)
          .toString()
          .padStart(2, '0');
        const mm = (clampedMin % 60).toString().padStart(2, '0');
        return `${hh}:${mm}:00`;
      }
      const start_time = minuteToTimeString(schedule.startMinute);
      // Clamp endMinute to 1439 (23:59)
      const end_time = minuteToTimeString(schedule.endMinute);
      const weekdayMap: Record<string, number> = {
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
        sun: 7,
      };
      const weekdays = schedule.repeatDays.map((d) => weekdayMap[d]).filter((n) => n !== undefined);
      const is_active = schedule.enabled;
      const response = await cameraService.updateWorkScheduleForRule(camera.id, ruleId, {
        member_ids,
        start_time,
        end_time,
        weekdays,
        is_active,
      });

      if (response.success) {
        showCommonAlert({
          title: t('uploadDetectZone.successTitle'),
          message: t('workSchedule.updateSuccessful'),
          buttons: [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ],
        });
      } else {
        showCommonAlert({
          title: t('uploadDetectZone.failureTitle'),
          message: t('workSchedule.updateFailed'),
          buttons: [
            {
              text: t('common.ok'),
            },
          ],
        });
      }
    } catch (error) {
      showCommonAlert({
        title: t('uploadDetectZone.failureTitle'),
        // @ts-ignore
        message: error.message,
        buttons: [
          {
            text: t('common.ok'),
          },
        ],
      });
    } finally {
      setSaving(false);
    }
  };

  // Fetch members when component mounts
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    setSelect2Items(members.map((m) => ({ label: m.name, value: m.id })));
  }, [members]);

  const DropDownSaveButton = React.useCallback(
    (props: { style?: StyleProp<ViewStyle> }) => (
      <SaveButton style={props.style} onPress={() => setOpenSelect2(false)} t={t} />
    ),

    [t]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{route.params?.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{t('workSchedule.scheduleEnabled')}</Text>
          <Switch
            value={schedule.enabled}
            onValueChange={onToggleEnabled}
            trackColor={{ false: '#2A3440', true: '#2A9EC6' }}
            thumbColor={'#F2F6FA'}
            ios_backgroundColor="#2A3440"
          />
        </View>

        {/* Multiple select */}
        <View style={styles.multipleSelectRow}>
          <Text style={styles.sectionLabel}>{t('workSchedule.selectFaceToApply')}</Text>
          <DropDownPicker
            open={openSelect2}
            value={select2Value}
            items={select2Items}
            setOpen={setOpenSelect2}
            setValue={setSelect2Value}
            setItems={setSelect2Items}
            multiple={true}
            mode="BADGE"
            placeholder={t('workSchedule.selectFaceToApply')}
            style={styles.styleMultipleSelectRow}
            // eslint-disable-next-line react-native/no-inline-styles
            placeholderStyle={{ color: '#fff' }}
            badgeDotColors={['#2A9EC6']}
            badgeColors={['#1d5cbb']}
            // eslint-disable-next-line react-native/no-inline-styles
            badgeTextStyle={{ color: '#fff' }}
            zIndex={1000}
            listMode="MODAL"
            searchable={true}
            searchPlaceholder={t('common.search')}
            CloseIconComponent={DropDownSaveButton}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('workSchedule.repeat')}</Text>

            {/* Weekday chips */}
            <View style={styles.daysRow}>
              {WEEKDAYS.map((d) => {
                const active = schedule.repeatDays.includes(d.key);
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => onToggleDay(d.key)}
                    style={[styles.dayChip, active ? styles.dayChipActive : styles.dayChipInactive]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        active ? styles.dayChipTextActive : styles.dayChipTextInactive,
                      ]}
                    >
                      {t(`workSchedule.weekdays.${d.key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Time row */}
            <View style={styles.timeHeaderRow}>
              <View style={styles.timeLeft}>
                <IconClockWorkSchedule />
                <Text style={styles.timeLabel}>{t('workSchedule.activeTime')}</Text>
              </View>

              <View style={styles.timePill}>
                <Text style={styles.timePillText}>{timeRangeText}</Text>
              </View>
            </View>

            {/* Range slider */}
            <View style={styles.sliderContainer}>
              <MultiSlider
                values={[schedule.startMinute, schedule.endMinute]}
                min={0}
                max={1439}
                step={5}
                onValuesChangeFinish={onChangeTime}
                sliderLength={sliderLength}
                trackStyle={styles.sliderTrack}
                selectedStyle={styles.sliderSelected}
                unselectedStyle={styles.sliderUnselected}
                containerStyle={styles.sliderAlignCenter}
                markerStyle={styles.sliderMarker}
              />

              <View style={styles.timeTicks}>
                <Text style={styles.tickText}>00:00</Text>
                <Text style={styles.tickText}>06:00</Text>
                <Text style={styles.tickText}>12:00</Text>
                <Text style={styles.tickText}>18:00</Text>
                <Text style={styles.tickText}>23:59</Text>
              </View>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.saveText}>{t('workSchedule.save')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
