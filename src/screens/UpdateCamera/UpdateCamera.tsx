import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './UpdateCamera.styles';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DownloadIcon from '@assets/svg/download-arrow-icon.svg';
import cameraService from '@/services/cameraService';

type UpdateCameraStackParamList = {
  UpdateCamera: {
    camera: any;
    latestFirmwareUpdate?: { description: string; id: string; version: string } | null;
  };
};

const UpdateCamera = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UpdateCameraStackParamList, 'UpdateCamera'>>();
  const { t } = useTranslation();
  const camera = route.params?.camera;
  const latestFirmwareUpdate = route.params?.latestFirmwareUpdate;

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!camera?.id) return;
      try {
        const response = await cameraService.getDetailCamera(camera.id);
        if (response.success && response.data) {
          setCurrentVersion(response.data.version ?? null);
          setNewVersion(response.data.latest_firmware_update?.version ?? null);
        }
      } catch (err) {
        console.warn('Failed to fetch camera detail:', err);
      }
    };
    fetchDetail();
  }, [camera?.id]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('settingAI.updateCameraVersion')}
            </Text>
          </View>
        </View>
        <View style={styles.styleViewButton}>
          <Text style={styles.styleText}>
            {t('updateCamera.currentCameraVersion')}: {currentVersion ?? t('updateCamera.latest')}
          </Text>
          {latestFirmwareUpdate && (
            <Text style={styles.styleText}>
              {t('updateCamera.aNewUpdateIsAvailable')}: {newVersion ?? t('updateCamera.latest')}
            </Text>
          )}
          <Text style={styles.styleText}>
            {t('updateCamera.note')}:{' '}
            {latestFirmwareUpdate
              ? t('updateCamera.noteDescription')
              : t('updateCamera.currentlyThereIsNoUpdateAvailable')}
          </Text>
          <TouchableOpacity
            style={[
              styles.styleButton,
              styles.styleButtonRelative,
              !latestFirmwareUpdate && styles.styleButtonDisabled,
            ]}
            onPress={() => {}}
            disabled={!latestFirmwareUpdate}
          >
            {latestFirmwareUpdate && (
              <View style={styles.newBadgeContainer}>
                <Text style={styles.newBadgeText}>{t('updateCamera.new')}</Text>
              </View>
            )}
            <View style={styles.styleTextButton}>
              <View style={styles.styleButtonUpdate}>
                <DownloadIcon />
              </View>
              <Text style={styles.styleText}>{t('settingAI.updateCameraVersion')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default UpdateCamera;
