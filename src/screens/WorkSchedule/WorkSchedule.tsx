import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@hooks/useResponsive';
import { styles, CONTAINER_H_PADDING, CARD_PADDING } from './WorkSchedule.style';
import IconClockWorkSchedule from '@assets/svg/icon-clock-workschedule.svg';
import faceService, { Member, MemberRelationship } from '@/services/faceService';
import { GroupedMemberPicker } from './GroupedMemberPicker';
import BackIcon from '@assets/svg/icon-back.svg';
import { WorkScheduleRouteProp } from '@navigation/types';
import cameraService from '@/services/cameraService';
import { showCommonAlert } from '@components/Alert/Alert';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Weekday = {
  key: string;
  label: string;
};

type ScheduleConfig = {
  enabled: boolean;
  repeatDays: string[];
  startMinute: number;
  endMinute: number;
  checkoutStartMinute: number;
  checkoutEndMinute: number;
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

function rangesOverlapInclusive(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

type AttendanceValidationMessageKey =
  | 'workSchedule.updateFailed'
  | 'workSchedule.attendanceRangesIdentical'
  | 'workSchedule.attendanceRangesOverlap'
  | 'workSchedule.attendanceCheckoutEndsBeforeWorkStart';

function getAttendanceValidationMessageKey(
  ws: number,
  we: number,
  cs: number,
  ce: number
): AttendanceValidationMessageKey | null {
  if (ws >= we || cs >= ce) return 'workSchedule.updateFailed';
  if (ws === cs && we === ce) return 'workSchedule.attendanceRangesIdentical';
  if (rangesOverlapInclusive(ws, we, cs, ce)) return 'workSchedule.attendanceRangesOverlap';
  if (ce < ws) return 'workSchedule.attendanceCheckoutEndsBeforeWorkStart';
  return null;
}

function minuteToTimeString(min: number): string {
  const clampedMin = Math.max(0, Math.min(min, 1439));
  const hh = Math.floor(clampedMin / 60)
    .toString()
    .padStart(2, '0');
  const mm = (clampedMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:00`;
}

const WEEKDAY_KEY_TO_NUM: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

const SCHEDULE_DEFAULTS = {
  workStartMin: 6 * 60,
  workEndMin: 18 * 60,
  checkoutStartMin: 18 * 60,
  checkoutEndMin: 19 * 60,
} as const;

const RULE_CODES_WITH_FACE_MEMBER_SELECT = new Set([
  'home_return_count',
  'vip_customer_detection',
  'access_prohibition_detection',
  'attendance',
  'restricted_area_intrusion',
  'enterprise_attendance',
  'helmet_wearing',
  'mask_wearing',
  'glove_wearing',
]);

export default function WorkSchedule() {
  const { t } = useTranslation();
  const { width } = useResponsive();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [relationships, setRelationships] = useState<MemberRelationship[]>([]);
  const [openSelect2, setOpenSelect2] = useState(false);
  const [select2Value, setSelect2Value] = useState<string[]>([]);
  const navigation = useNavigation();
  const route = useRoute<WorkScheduleRouteProp>();
  const camera = route.params?.camera;
  const ruleId = route.params?.ruleId;
  const code = route.params?.code;
  const isAttendanceRule = code === 'attendance' || code === 'enterprise_attendance';

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
      const startMinute =
        data.start_time != null && data.start_time !== ''
          ? timeToMinutes(data.start_time)
          : SCHEDULE_DEFAULTS.workStartMin;
      const endMinute =
        data.end_time != null && data.end_time !== ''
          ? timeToMinutes(data.end_time)
          : SCHEDULE_DEFAULTS.workEndMin;
      const checkoutStart =
        data.checkout_start_time != null && data.checkout_start_time !== ''
          ? timeToMinutes(data.checkout_start_time)
          : SCHEDULE_DEFAULTS.checkoutStartMin;
      const checkoutEnd =
        data.checkout_end_time != null && data.checkout_end_time !== ''
          ? timeToMinutes(data.checkout_end_time)
          : SCHEDULE_DEFAULTS.checkoutEndMin;
      setSchedule({
        enabled: data.is_active,
        repeatDays,
        startMinute,
        endMinute,
        checkoutStartMinute: checkoutStart,
        checkoutEndMinute: checkoutEnd,
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
    checkoutStartMinute: 17 * 60,
    checkoutEndMinute: 19 * 60,
  });
  const [saving, setSaving] = useState(false);

  const formatMinuteRange = useCallback((startMin: number, endMin: number) => {
    function pad2(n: number) {
      return n < 10 ? `0${n}` : `${n}`;
    }
    function minuteToHHmm(min: number) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      return `${pad2(hh)}:${pad2(mm)}`;
    }
    return `${minuteToHHmm(startMin)} - ${minuteToHHmm(endMin)}`;
  }, []);

  const timeRangeText = useMemo(
    () => formatMinuteRange(schedule.startMinute, schedule.endMinute),
    [formatMinuteRange, schedule.startMinute, schedule.endMinute]
  );

  const checkoutTimeRangeText = useMemo(
    () => formatMinuteRange(schedule.checkoutStartMinute, schedule.checkoutEndMinute),
    [formatMinuteRange, schedule.checkoutStartMinute, schedule.checkoutEndMinute]
  );

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

  const onChangeCheckoutTime = useCallback(async (values: number[]) => {
    const [checkoutStartMinute, checkoutEndMinute] = values;
    setSchedule((p) => ({ ...p, checkoutStartMinute, checkoutEndMinute }));
  }, []);

  const fetchMembers = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        const response = await faceService.getMembers({ page: 1, per_page: 50 });
        setMembers(response.data);
        setMembersPage(1);
        setHasMoreMembers(response.meta?.has_next ?? false);
      } else {
        setLoadingMoreMembers(true);
        const response = await faceService.getMembers({ page, per_page: 10 });
        setMembers((prev) => [...prev, ...response.data]);
        setMembersPage(page);
        setHasMoreMembers(response.meta?.has_next ?? false);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMoreMembers(false);
    }
  }, []);

  const loadMoreMembers = useCallback(async () => {
    if (loadingMoreMembers || !hasMoreMembers) return;
    await fetchMembers(membersPage + 1);
  }, [fetchMembers, membersPage, hasMoreMembers, loadingMoreMembers]);

  const fetchRelationships = useCallback(async () => {
    try {
      const data = await faceService.getMemberRelationships();
      setRelationships(data);
    } catch (error) {
      console.error('Failed to fetch member relationships:', error);
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isAttendanceRule) {
        const validationKey = getAttendanceValidationMessageKey(
          schedule.startMinute,
          schedule.endMinute,
          schedule.checkoutStartMinute,
          schedule.checkoutEndMinute
        );
        if (validationKey) {
          showCommonAlert({
            title: t('uploadDetectZone.failureTitle'),
            message: t(validationKey),
            buttons: [{ text: t('common.ok') }],
          });
          return;
        }
      }

      const member_ids = select2Value;
      const start_time = minuteToTimeString(schedule.startMinute);
      const end_time = minuteToTimeString(schedule.endMinute);
      const checkout_start_time = minuteToTimeString(schedule.checkoutStartMinute);
      const checkout_end_time = minuteToTimeString(schedule.checkoutEndMinute);
      const weekdays = schedule.repeatDays
        .map((d) => WEEKDAY_KEY_TO_NUM[d])
        .filter((n) => n !== undefined);
      const is_active = schedule.enabled;
      const schedulePayload: Record<string, unknown> = {
        member_ids,
        start_time,
        end_time,
        weekdays,
        is_active,
      };
      if (isAttendanceRule) {
        schedulePayload.checkout_start_time = checkout_start_time;
        schedulePayload.checkout_end_time = checkout_end_time;
      }

      const response = await cameraService.updateWorkScheduleForRule(
        camera.id,
        ruleId,
        schedulePayload
      );

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

  // Fetch members and relationships when component mounts
  useEffect(() => {
    fetchMembers();
    fetchRelationships();
  }, [fetchMembers, fetchRelationships]);

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
        {code && RULE_CODES_WITH_FACE_MEMBER_SELECT.has(code) ? (
          <View style={styles.multipleSelectRow}>
            <Text style={styles.sectionLabel}>{t('workSchedule.selectFaceToApply')}</Text>
            <View style={styles.select2Row}>
              <TouchableOpacity
                style={styles.select2Trigger}
                onPress={() => setOpenSelect2(true)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {select2Value.length > 0 ? (
                  <View style={styles.memberChipRow}>
                    {select2Value
                      .map((id) => members.find((m) => m.id === id))
                      .filter(Boolean)
                      .map((m) => (
                        <View key={m!.id} style={[styles.memberChip, styles.memberChipActive]}>
                          <Text style={[styles.memberChipText, styles.memberChipTextActive]}>
                            {m!.name}
                          </Text>
                        </View>
                      ))}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.dropDownPlaceholderStyleEnabled,
                      // eslint-disable-next-line react-native/no-inline-styles
                      { opacity: 0.7 },
                    ]}
                  >
                    {t('workSchedule.selectFaceToApply')}
                  </Text>
                )}
              </TouchableOpacity>
              {select2Value.length > 0 && (
                <TouchableOpacity
                  style={styles.select2ClearBtn}
                  onPress={() => setSelect2Value([])}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close-circle" size={24} color="rgba(234,241,247,0.8)" />
                </TouchableOpacity>
              )}
            </View>
            {openSelect2 && (
              <GroupedMemberPicker
                members={members}
                relationships={relationships}
                value={select2Value}
                onChange={setSelect2Value}
                placeholder={t('workSchedule.selectFaceToApply')}
                onClose={() => setOpenSelect2(false)}
                searchPlaceholder={t('common.search')}
                saveButtonLabel={t('workSchedule.save')}
                otherLabel={t('workSchedule.other')}
                onLoadMore={loadMoreMembers}
                hasMore={hasMoreMembers}
                loadingMore={loadingMoreMembers}
                styles={{
                  styleMultipleSelectRow: styles.styleMultipleSelectRow,
                  listParentContainer: styles.listParentContainer,
                  listParentLabel: styles.listParentLabel,
                  listChildContainer: styles.listChildContainer,
                  listChildLabel: styles.listChildLabel,
                  button: styles.button,
                  text: styles.text,
                }}
              />
            )}
          </View>
        ) : undefined}

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

            {isAttendanceRule ? (
              <>
                <View style={styles.timeHeaderRow}>
                  <View style={styles.timeLeft}>
                    <IconClockWorkSchedule />
                    <Text style={styles.timeLabel}>{t('workSchedule.checkInTimeRange')}</Text>
                  </View>
                  <View style={styles.timePill}>
                    <Text style={styles.timePillText}>{timeRangeText}</Text>
                  </View>
                </View>
                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={[schedule.startMinute, schedule.endMinute]}
                    min={0}
                    max={1439}
                    step={1}
                    onValuesChange={onChangeTime}
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

                <View style={styles.divider} />

                <View style={styles.timeHeaderRow}>
                  <View style={styles.timeLeft}>
                    <IconClockWorkSchedule />
                    <Text style={styles.timeLabel}>{t('workSchedule.checkOutTimeRange')}</Text>
                  </View>
                  <View style={styles.timePill}>
                    <Text style={styles.timePillText}>{checkoutTimeRangeText}</Text>
                  </View>
                </View>
                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={[schedule.checkoutStartMinute, schedule.checkoutEndMinute]}
                    min={0}
                    max={1439}
                    step={1}
                    onValuesChange={onChangeCheckoutTime}
                    onValuesChangeFinish={onChangeCheckoutTime}
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
              </>
            ) : (
              <>
                <View style={styles.timeHeaderRow}>
                  <View style={styles.timeLeft}>
                    <IconClockWorkSchedule />
                    <Text style={styles.timeLabel}>{t('workSchedule.activeTime')}</Text>
                  </View>
                  <View style={styles.timePill}>
                    <Text style={styles.timePillText}>{timeRangeText}</Text>
                  </View>
                </View>
                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={[schedule.startMinute, schedule.endMinute]}
                    min={0}
                    max={1439}
                    step={1}
                    onValuesChange={onChangeTime}
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
              </>
            )}
          </View>

          {/* Save button */}
          <Pressable
            onPress={saving ? undefined : handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              saving && { backgroundColor: '#ccc' },
              pressed && !saving && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.saveText}>{t('workSchedule.save')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
