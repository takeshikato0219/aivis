import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './SettingAI.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import IconSettingZone from '@assets/svg/icon-setting-zone.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import IconClockSetting from '@assets/svg/icon-clock-setting.svg';
import IconAISetting from '@assets/svg/icon-ai-setting.svg';

type SettingAIStackParamList = {
  SettingAI: { camera: any };
};

const SettingAI = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingAIStackParamList, 'SettingAI'>>();
  const { t } = useTranslation();
  const camera = route.params?.camera;

  const handleSetupDetectionZone = () => {
    (navigation as any).navigate('DetectionZoneSetup', {
      camera: camera,
    });
  };

  const handleSetupClockSchedule = () => {
    (navigation as any).navigate('ClockScheduleSetup');
  };

  const handleSetupAIRule = () => {
    (navigation as any).navigate('AIRuleSetup');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('settingAI.settingAI')}
            </Text>
          </View>
        </View>
        <View style={styles.styleViewButton}>
          <TouchableOpacity style={styles.styleButton} onPress={handleSetupDetectionZone}>
            <View style={styles.styleTextButton}>
              <IconSettingZone />
              <Text style={styles.styleText}>{t('settingAI.detectionAreaSetup')}</Text>
            </View>
            <MoveRightIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.styleButton} onPress={handleSetupClockSchedule}>
            <View style={styles.styleTextButton}>
              <IconClockSetting />
              <Text style={styles.styleText}>{t('settingAI.operationSchedule')}</Text>
            </View>
            <MoveRightIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.styleButton} onPress={handleSetupAIRule}>
            <View style={styles.styleTextButton}>
              <IconAISetting />
              <Text style={styles.styleText}>{t('settingAI.aIDetectionRules')}</Text>
            </View>
            <MoveRightIcon />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SettingAI;
