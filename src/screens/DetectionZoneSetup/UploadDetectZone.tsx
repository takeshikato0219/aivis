import React, { useEffect, useState } from 'react';
import { View, StatusBar, TouchableOpacity, Text } from 'react-native';
import { styles } from '@screens/FaceUpload/FaceUpload.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import cameraService from '@/services/cameraService';
import detectionZoneService from '@/services/detectionZone';

type SettingAIStackParamList = {
  SettingAI: { camera: any };
};

export default function UploadDetectZone() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingAIStackParamList, 'SettingAI'>>();
  const { t } = useTranslation();
  const [link, setLink] = useState<string>('');
  const camera = route.params?.camera;

  const getLinkLive = React.useCallback(async () => {
    const response = await cameraService.getLiveStreamUrl(camera.id);
    setLink(response.data.live_url);
  }, [camera]);

  useEffect(() => {
    getLinkLive();
  }, [getLinkLive]);

  const getTypeZone = async (zoneType: 'detection' | 'restricted' | 'entry_exit') => {
    const response = await detectionZoneService.getType();
    if (zoneType === 'detection') {
      return response.data[0].id;
    } else if (zoneType === 'restricted') {
      return response.data[1].id;
    } else if (zoneType === 'entry_exit') {
      return response.data[2].id;
    }
    return '';
  };

  const handleSetupDetectionZone = async (zoneType: 'detection' | 'restricted' | 'entry_exit') => {
    const typeId = await getTypeZone(zoneType);
    (navigation as any).navigate('DetectionZoneSetup', {
      camera: camera,
      zoneType: zoneType,
      typeId: typeId,
      liveUrl: link,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('uploadDetectZone.setupDetectZone')}
            </Text>
          </View>
          <View style={styles.styleWidth} />
        </View>
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSetupDetectionZone('detection')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>{t('uploadDetectZone.setupDetectionZone')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSetupDetectionZone('restricted')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>{t('uploadDetectZone.setupRestrictedZone')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSetupDetectionZone('entry_exit')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>{t('uploadDetectZone.setupEntryExit')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
