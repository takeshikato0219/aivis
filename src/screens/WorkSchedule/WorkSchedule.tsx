import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, Switch, StatusBar, ScrollView } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@hooks/useResponsive';
import { styles, CONTAINER_H_PADDING, CARD_PADDING } from './WorkSchedule.style';
import IconClockWorkSchedule from '@assets/svg/icon-clock-workschedule.svg';

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

export default function WorkSchedule() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { width } = useResponsive();

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

  async function apiUpdateScheduleDraft(_payload: Partial<ScheduleConfig>) {
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true };
  }
  async function apiSaveSchedule(_payload: ScheduleConfig) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }

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
    await apiUpdateScheduleDraft({ enabled });
  }, []);

  const onToggleDay = useCallback(async (dayKey: string) => {
    setSchedule((prev) => {
      const exists = prev.repeatDays.includes(dayKey);
      const nextDays = exists
        ? prev.repeatDays.filter((d) => d !== dayKey)
        : [...prev.repeatDays, dayKey];

      apiUpdateScheduleDraft({ repeatDays: nextDays });
      return { ...prev, repeatDays: nextDays };
    });
  }, []);

  const onChangeTime = useCallback(async (values: number[]) => {
    const [startMinute, endMinute] = values;
    setSchedule((p) => ({ ...p, startMinute, endMinute }));
    await apiUpdateScheduleDraft({ startMinute, endMinute });
  }, []);

  const onPressSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await apiSaveSchedule(schedule);
      if (!res.ok) {
      }
    } finally {
      setSaving(false);
    }
  }, [schedule]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{t('settingAI.operationSchedule')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Card */}
          <View style={styles.card}>
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

            <View style={styles.blueLine} />

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
                enabledOne={schedule.enabled}
                enabledTwo={schedule.enabled}
                onValuesChangeFinish={onChangeTime}
                sliderLength={sliderLength}
                trackStyle={styles.sliderTrack}
                selectedStyle={styles.sliderSelected}
                unselectedStyle={styles.sliderUnselected}
                markerStyle={styles.sliderMarker}
                containerStyle={styles.sliderAlignCenter}
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
            onPress={onPressSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.9 },
              saving && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.saveIcon}>✓</Text>
            <Text style={styles.saveText}>
              {saving ? t('workSchedule.saving') : t('workSchedule.save')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
