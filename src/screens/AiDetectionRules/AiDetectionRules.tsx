import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ListRenderItemInfo,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { styles } from './AiDetectionRules.style';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackIcon from '@assets/svg/icon-back.svg';
import ruleService from '@api/ruleService';
export type AiRule = {
  id: string;
  title: string;
  enabled: boolean;
};

const RULES: AiRule[] = [
  { id: 'helmet', title: 'ヘルメット着用検知', enabled: true },
  { id: 'mask', title: 'マスク着用検知', enabled: true },
  { id: 'intrusion', title: '侵入検知', enabled: true },
];

export default function AiDetectionRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<AiRule[]>(RULES);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const navigation = useNavigation();

  async function updateRuleOnServer(params: { id: string; enabled: boolean }) {
    try {
      const response = await fetch(`https://api.example.com/ai-rules/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: params.enabled }),
      });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  const onToggleRule = useCallback(async (id: string, nextEnabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: nextEnabled } : r)));

    setLoadingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await updateRuleOnServer({ id, enabled: nextEnabled });

      if (!res.ok) {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !nextEnabled } : r)));
      }
    } catch {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !nextEnabled } : r)));
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const fetchRules = async () => {
    const response = await ruleService.getRuleMasterList();
    const mappedRules: AiRule[] = response.data
      .filter((item: any) => item.is_active)
      .map((item: any) => ({
        id: item.id,
        title: item.rule_name,
        enabled: item.is_active,
      }));
    setRules(mappedRules);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSetupClockSchedule = useCallback(() => {
    (navigation as any).navigate('WorkSchedule');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AiRule>) => {
      const isLast = index === rules.length - 1;
      const isLoading = !!loadingIds[item.id];

      return (
        <>
          <Pressable onPress={handleSetupClockSchedule} disabled={isLoading} style={styles.row}>
            <View style={styles.left}>
              <Text style={styles.title}>{item.title}</Text>
            </View>

            <Icon name="chevron-right" size={24} color="#FFF" />
          </Pressable>
          {!isLast && <View style={styles.divider} />}
        </>
      );
    },
    [loadingIds, rules.length, handleSetupClockSchedule]
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

          <Text style={styles.headerTitle}>{t('settingAI.aIDetectionRules')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>{t('aiDetectionRules.subtitle')}</Text>

        {/* Card */}
        <View style={styles.card}>
          <FlatList
            data={rules}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={styles.cardContent}
          />
        </View>

        {/* Footer hint */}
        <View style={styles.footer}>
          <Text style={styles.footerIcon}>ⓘ</Text>
          <Text style={styles.footerText}>{t('aiDetectionRules.warning')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
