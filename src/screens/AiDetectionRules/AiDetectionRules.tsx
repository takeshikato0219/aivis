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
import Rule from '@/services/rule';
export type AiRule = {
  id: string;
  title: string;
  enabled: boolean;
};

export default function AiDetectionRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<AiRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const ruleService = React.useMemo(() => new Rule(), []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ruleService.getRuleMasterList();
      const mappedRules: AiRule[] = response.data
        .filter((item: any) => item.is_active)
        .map((item: any) => ({
          id: item.id,
          title: item.rule_name,
          enabled: item.is_active,
        }));
      setRules(mappedRules);
    } catch {
      setError('ルールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [ruleService]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSetupClockSchedule = useCallback(() => {
    (navigation as any).navigate('WorkSchedule');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AiRule>) => {
      const isLast = index === rules.length - 1;
      return (
        <>
          <Pressable onPress={handleSetupClockSchedule} style={styles.row}>
            <View style={styles.left}>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </Pressable>
          {!isLast && <View style={styles.divider} />}
        </>
      );
    },
    [rules.length, handleSetupClockSchedule]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
