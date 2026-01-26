import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './Detail.styles';

import BackIcon from '@assets/svg/icon-back.svg';
import SettingsIcon from '@assets/svg/icon-setting.svg';
import LogoDetail from '@assets/svg/logo-detail.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import IconWarningUnActive from '@assets/svg/icon-warning-unactive.svg';
import IconWarningActive from '@assets/svg/icon-warning-active.svg';
import IconSafeActive from '@assets/svg/icon-safe-active.svg';
import IconSafeUnActive from '@assets/svg/icon-safe-unactive.svg';
import IconUnlockActive from '@assets/svg/icon-lock-active.svg';
import IconUnlockUnActive from '@assets/svg/icon-lock-unactive.svg';
import RetangleImage from '@assets/png/rectangle-home.png';
import CameraHomeDetailBgPng from '@assets/png/camera-home-detail-bg.png';
import CameraFactoryDetailBgPng from '@assets/png/camera-factory-detail-bg.png';
import CameraShopDetailBgPng from '@assets/png/camera-shop-detail-bg.png';
import Frame21 from '@assets/png/frame-21.png';
import Frame27 from '@assets/png/frame-27.png';
import Frame28 from '@assets/png/frame-28.png';
import Frame29 from '@assets/png/frame-29.png';
import Frame30 from '@assets/png/frame-30.png';
import Frame31 from '@assets/png/frame-31.png';

import { DetailScreenNavigationProp, DetailScreenRouteProp } from '@navigation/types';

const frames = [Frame21, Frame27, Frame28, Frame29, Frame30, Frame31];

const INITIAL_LIST = [
  { id: '1', name: 'Front Door', status: 'Online' },
  { id: '2', name: 'Backyard', status: 'Offline' },
  { id: '3', name: 'Garage', status: 'Online' },
  { id: '4', name: 'Living Room', status: 'Online' },
].map((item) => ({
  ...item,
  frame: frames[Math.floor(Math.random() * frames.length)],
}));

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const Detail = () => {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const route = useRoute<DetailScreenRouteProp>();
  const title = route.params?.name || 'Detail';

  const filters = [
    { name: '警戒モード', iconActive: IconWarningActive, iconUnActive: IconWarningUnActive },
    { name: '安心モード', iconActive: IconSafeActive, iconUnActive: IconSafeUnActive },
    { name: '解除モード', iconActive: IconUnlockActive, iconUnActive: IconUnlockUnActive },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const backgrounds = [CameraShopDetailBgPng, CameraHomeDetailBgPng, CameraFactoryDetailBgPng];

  const activeBorderStyles = [
    styles.filterBtnActiveWarning,
    styles.filterBtnActiveSafe,
    styles.filterBtnActiveLock,
  ];

  const handleCameraPress = (item: any) => {
    navigation.navigate('CameraLive', {
      cameraId: item.id,
      cameraName: item.name,
      baseUrl: 'https://your-camera-api.com',
    });
  };

  const handleSetupDetectionZone = () => {
    navigation.navigate('DetectionZoneSetup', {
      cameraId: '',
      cameraSnapshot: '',
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgrounds[activeIndex]}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>

            <View style={styles.viewTitle}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSetupDetectionZone}>
              <SettingsIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollViewPaddingBottom}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <View style={styles.card}>
                <View style={styles.videoWrapper}>
                  <Image source={RetangleImage} style={styles.cardImage} />
                </View>
                <View style={styles.cardBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Online</Text>
                </View>
              </View>

              <View style={styles.cartSecurityMode}>
                <Text style={styles.textSecurityMode}>セキュリティモード</Text>
                <LogoDetail />
              </View>

              <View style={styles.filterRow}>
                {filters.map((filter, idx) => {
                  const Icon = activeIndex === idx ? filter.iconActive : filter.iconUnActive;

                  return (
                    <TouchableOpacity
                      key={filter.name}
                      style={[
                        styles.filterBtn,
                        activeIndex === idx && styles.activeFilterBtn,
                        activeIndex === idx && activeBorderStyles[idx],
                      ]}
                      onPress={() => setActiveIndex(idx)}
                    >
                      <Icon />
                      <Text style={styles.filterText}>{filter.name}</Text>
                      <Text style={styles.filterSmall}>侵入 知 即時通知</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* Camera List */}
            {INITIAL_LIST.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <ItemSeparator />}
                <TouchableWithoutFeedback onPress={() => handleCameraPress(item)}>
                  <ImageBackground source={item.frame} style={styles.rowFront} resizeMode="cover">
                    <Text style={styles.filterText}>{item.name}</Text>
                    <MoveRightIcon />
                  </ImageBackground>
                </TouchableWithoutFeedback>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Detail;
