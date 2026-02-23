import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  FlatList,
  ListRenderItemInfo,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { styles } from './AiDetectionRules.style';
export type AiRule = {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
};

const RULES: AiRule[] = [
  { id: 'helmet', title: 'ヘルメット着用検知', icon: '⛑️', enabled: true },
  { id: 'mask', title: 'マスク着用検知', icon: '😷', enabled: true },
  { id: 'intrusion', title: '侵入検知', icon: '🚶', enabled: true },
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

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AiRule>) => {
      const isLast = index === rules.length - 1;
      const isLoading = !!loadingIds[item.id];

      return (
        <View>
          <View style={styles.row}>
            <View style={styles.left}>
              <View style={styles.iconWrap}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
            </View>

            <Switch
              value={item.enabled}
              onValueChange={(v) => onToggleRule(item.id, v)}
              trackColor={{ false: '#2A3440', true: '#2A9EC6' }}
              thumbColor={'#F2F6FA'}
              ios_backgroundColor="#2A3440"
              disabled={isLoading}
            />
          </View>

          {!isLast && <View style={styles.divider} />}
        </View>
      );
    },
    [loadingIds, onToggleRule, rules.length]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

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
