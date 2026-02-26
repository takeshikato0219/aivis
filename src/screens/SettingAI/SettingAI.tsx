import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './SettingAI.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import IconSettingZone from '@assets/svg/icon-setting-zone.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import IconAISetting from '@assets/svg/icon-ai-setting.svg';
import { showCommonAlert } from '@components/Alert/Alert';
import cameraService from '@api/cameraService';

type SettingAIStackParamList = {
  SettingAI: { camera: any };
};

const SettingAI = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingAIStackParamList, 'SettingAI'>>();
  const { t } = useTranslation();
  const camera = route.params?.camera;

  const handleListDetectionZone = () => {
    (navigation as any).navigate('UploadDetectZone', {
      camera: camera,
    });
  };

  const handleSetupAIRule = () => {
    (navigation as any).navigate('AiDetectionRules', {
      camera: camera,
    });
  };

  const handleDeleteCamera = async () => {
    showCommonAlert({
      title: '',
      message: t('settingAI.doYouWantToDelete'),
      buttons: [
        {
          text: t('common.ok'),
          onPress: () => deleteCamera(),
        },
        {
          text: t('common.cancel'),
          onPress: () => {},
        },
      ],
    });
  };

  const deleteCamera = async () => {
    try {
      const response = await cameraService.deleteCamera(camera.id);
      if (response.success) {
        showCommonAlert({
          title: '',
          message: response.message,
          buttons: [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Home' as any),
            },
          ],
        });
      }
    } catch (error) {
      showCommonAlert({
        title: '',
        message: error instanceof Error ? error.message : t('common.error'),
        buttons: [
          {
            text: t('common.ok'),
          },
        ],
      });
    }
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
          <TouchableOpacity style={styles.styleButton} onPress={handleListDetectionZone}>
            <View style={styles.styleTextButton}>
              <IconSettingZone />
              <Text style={styles.styleText}>{t('settingAI.detectionAreaSetup')}</Text>
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
          <TouchableOpacity style={styles.styleButtonDelete} onPress={handleDeleteCamera}>
            <View style={styles.styleTextButton}>
              <Text style={styles.styleText}>{t('settingAI.deleteCamera')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SettingAI;
