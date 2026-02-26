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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { styles } from './AiDetectionRules.style';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackIcon from '@assets/svg/icon-back.svg';
import cameraService from '@api/cameraService';
export type AiRule = {
  id: string;
  title: string;
  enabled: boolean;
};

type AiDetectionRulesStackParamList = {
  AiDetectionRules: { camera: any };
};

export default function AiDetectionRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<AiRule[]>([]);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AiDetectionRulesStackParamList, 'AiDetectionRules'>>();
  const camera = route.params?.camera;

  const fetchRules = useCallback(async () => {
    if (!camera?.id) return;
    const response = await cameraService.getRulesForCamera(camera.id);
    const mappedRules: AiRule[] = response.data
      .filter((item: any) => item.is_active)
      .map((item: any) => ({
        id: item.id,
        title: item.name,
        enabled: item.is_active,
      }));
    setRules(mappedRules);
  }, [camera?.id]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSetupClockSchedule = useCallback(
    (ruleId: string, title: string) => {
      (navigation as any).navigate('WorkSchedule', {
        camera: camera,
        ruleId,
        title,
      });
    },
    [camera, navigation]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AiRule>) => {
      const isLast = index === rules.length - 1;
      return (
        <>
          <Pressable
            onPress={() => handleSetupClockSchedule(item.id, item.title)}
            style={styles.row}
          >
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
          {rules.length === 0 ? (
            <View style={styles.noRuleContainer}>
              <Text style={styles.noRuleText}>No rule</Text>
            </View>
          ) : (
            <FlatList
              data={rules}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.cardContent}
            />
          )}
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
