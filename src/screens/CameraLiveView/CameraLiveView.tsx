import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  FlatList,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Video, { VideoRef, OnLoadData, OnVideoErrorData } from 'react-native-video';
import { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CameraLiveScreenNavigationProp, CameraLiveScreenRouteProp } from '@navigation/types';
import { CameraConfig, StreamQuality } from '@/services/cameraService';
import cameraService from '../../services/cameraService';
import webRTCManager from '../../services/webRTCManager';
import recordingService from '../../services/recordingService';
import { getStyles } from './CameraLiveView.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoDetail from '@assets/svg/logo-detail.svg';
import CloseIcon from '@assets/svg/close-icon.svg';
import NoRecordingDataIcon from '@assets/svg/no-recording-data-icon.svg';
import { useTranslation } from 'react-i18next';

const STREAM_QUALITIES: StreamQuality[] = [
  { label: '流畅', value: 'low', resolution: '640x480', bitrate: 256 },
  { label: '标清', value: 'medium', resolution: '1280x720', bitrate: 512 },
  { label: '高清', value: 'high', resolution: '1920x1080', bitrate: 1024 },
  { label: 'HD', value: 'hd', resolution: '2560x1440', bitrate: 2048 },
];

const TEST_STREAMS = ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'];

const CameraLiveView: React.FC = () => {
  const navigation = useNavigation<CameraLiveScreenNavigationProp>();
  const route = useRoute<CameraLiveScreenRouteProp>();
  const videoRef = useRef<VideoRef>(null);
  const videoContainerRef = useRef<View>(null);
  const { cameraId, baseUrl = 'https://your-camera-api.com' } = route.params;
  const { t } = useTranslation();

  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // States
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>(STREAM_QUALITIES[2]);
  const [bitrate, setBitrate] = useState<number>(0);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState<string>('');
  const [streamIndex, setStreamIndex] = useState(0);

  // Animation effect for quality modal
  useEffect(() => {
    if (isAnimating) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (showQualityModal) {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowQualityModal(false);
      });
    }
  }, [isAnimating, showQualityModal, slideAnim, opacityAnim, height]);

  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setVideoError('');

      const cameraConfig: CameraConfig = {
        baseUrl,
        cameraId,
      };
      cameraService.initialize(cameraConfig);

      try {
        const url = await cameraService.getStreamUrl(currentQuality.value);
        setStreamUrl(url);
        console.log('Stream URL from service:', url);
      } catch (error) {
        console.log('Using test stream, service error:', error);
        setStreamUrl(TEST_STREAMS[streamIndex]);
      }

      try {
        const status = await cameraService.getCameraStatus();
        setBitrate(status.bitrate);
      } catch (error) {
        console.log('Cannot get camera status:', error);
        setBitrate(currentQuality.bitrate);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing camera:', error);
      setVideoError('初始化失败');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, cameraId, currentQuality.value, streamIndex]);

  useEffect(() => {
    const cleanup = async () => {
      if (isTalking) {
        await stopTalking();
      }
      webRTCManager.closeConnection();
    };

    initializeCamera();

    return () => {
      void cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeCamera]);

  const handleVideoLoad = (data: OnLoadData) => {
    console.log('Video loaded successfully:', data);
    setIsLoading(false);
    setVideoError('');
  };

  const handleVideoError = (error: OnVideoErrorData) => {
    console.error('Video error details:', error);

    const errorMessage =
      error?.error?.errorString || error?.error?.localizedDescription || 'Unknown error';

    setVideoError(errorMessage);
    setIsLoading(false);

    if (streamIndex < TEST_STREAMS.length - 1) {
      setTimeout(() => {
        console.log(`Trying stream ${streamIndex + 1}... `);
        setStreamIndex(streamIndex + 1);
        setStreamUrl(TEST_STREAMS[streamIndex + 1]);
        setIsLoading(true);
      }, 2000);
    }
  };

  const retryStream = () => {
    setStreamIndex(0);
    setVideoError('');
    initializeCamera();
  };

  const requestFullscreen = () => {
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const takeSnapshot = useCallback(async () => {
    try {
      // Check if videoContainerRef is available
      if (!videoContainerRef.current) {
        Alert.alert(t('common.error'), t('cameraLive.failedToCaptureSnapshot'));
        return;
      }

      // Use captureRef to capture the video container view
      // This works better on Android with collapsable={false} set on the View
      const uri = await captureRef(videoContainerRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (!uri) {
        Alert.alert(t('common.error'), t('cameraLive.failedToCaptureSnapshot'));
        return;
      }

      // Request photo library permission
      let permissionStatus;
      if (Platform.OS === 'ios') {
        // iOS: Use PHOTO_LIBRARY_ADD_ONLY for iOS 11+ (only write access)
        permissionStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        if (permissionStatus !== RESULTS.GRANTED) {
          permissionStatus = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        }
      } else {
        const androidVersion =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        const permission =
          androidVersion >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

        permissionStatus = await check(permission);
        if (permissionStatus !== RESULTS.GRANTED) {
          permissionStatus = await request(permission);
        }
      }

      if (permissionStatus !== RESULTS.GRANTED) {
        Alert.alert(
          t('common.error'),
          Platform.OS === 'ios'
            ? 'Photo library permission is required to save screenshots'
            : 'Storage permission is required to save screenshots'
        );
        return;
      }

      await CameraRoll.saveToCameraRoll(uri, 'photo');
      Alert.alert(t('cameraLive.success'), t('cameraLive.screenshotSaved'));
    } catch (error) {
      console.error('Error taking snapshot:', error);
      Alert.alert(t('common.error'), t('cameraLive.unableToTakeScreenshot'));
    }
  }, [t]);

  const toggleTalk = async () => {
    try {
      if (!isTalking) {
        await webRTCManager.initializePeerConnection();
        const stream = await webRTCManager.startLocalAudioStream();

        if (stream) {
          const offer = await webRTCManager.createOffer();
          console.log(offer);
          await cameraService.startAudioStream('audio-stream-url');
          setIsTalking(true);
        }
      } else {
        await stopTalking();
      }
    } catch (error) {
      console.error('Error toggling talk:', error);
      Alert.alert(t('common.error'), t('cameraLive.unableToEnableVoiceFunction'));
    }
  };

  const stopTalking = async () => {
    try {
      await cameraService.stopAudioStream();
      webRTCManager.stopLocalAudioStream();
      setIsTalking(false);
    } catch (error) {
      console.error('Error stopping talk:', error);
    }
  };

  const openQualityModal = () => {
    setShowQualityModal(true);
    setIsAnimating(true);
  };

  const closeQualityModal = () => {
    setIsAnimating(false);
  };

  const changeQuality = async (quality: StreamQuality) => {
    try {
      setIsLoading(true);
      closeQualityModal();

      setCurrentQuality(quality);
      setBitrate(quality.bitrate);

      try {
        await cameraService.changeResolution(quality.value);
        const newUrl = await cameraService.getStreamUrl(quality.value);
        setStreamUrl(newUrl);
      } catch (error) {
        console.log('Using test stream for quality change', error);
        setStreamUrl(TEST_STREAMS[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error changing quality:', error);
      Alert.alert(t('common.error'), t('common.unableToChangeResolution'));
      setIsLoading(false);
    }
  };

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      // Start screen recording
      try {
        await recordingService.startRecording();
        setIsRecording(true);
        setRecordingStartTime(new Date());
        Alert.alert(t('cameraLive.recording'), t('cameraLive.recordingStarted'));
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert(
          t('common.error'),
          t('cameraLive.unableToStartRecording') || 'Unable to start recording'
        );
      }
    } else {
      // Stop recording and save video
      try {
        const startTime = recordingStartTime;

        // Stop the screen recording and get the file path
        const videoFilePath = await recordingService.stopRecording();
        setIsRecording(false);
        setRecordingStartTime(null);

        // Request photo library permission for saving video
        let permissionStatus;
        if (Platform.OS === 'ios') {
          // iOS: Use PHOTO_LIBRARY_ADD_ONLY for iOS 11+ (only write access)
          permissionStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
          if (permissionStatus !== RESULTS.GRANTED) {
            permissionStatus = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
          }
        } else {
          // Android: Use appropriate permission based on Android version
          const androidVersion =
            typeof Platform.Version === 'number'
              ? Platform.Version
              : parseInt(String(Platform.Version), 10);
          const permission =
            androidVersion >= 33
              ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
              : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

          permissionStatus = await check(permission);
          if (permissionStatus !== RESULTS.GRANTED) {
            permissionStatus = await request(permission);
          }
        }

        if (permissionStatus !== RESULTS.GRANTED) {
          Alert.alert(
            t('common.error'),
            Platform.OS === 'ios'
              ? 'Photo library permission is required to save videos'
              : 'Storage permission is required to save videos'
          );
          return;
        }

        // Save the recorded video to gallery
        await recordingService.saveToGallery(videoFilePath);

        // Clean up temporary files
        await recordingService.cleanSandbox();

        const duration = startTime
          ? Math.round((new Date().getTime() - startTime.getTime()) / 1000)
          : recordingService.getRecordingDuration();
        Alert.alert(t('cameraLive.success'), `${t('cameraLive.videoSaved')} (${duration}s)`);
      } catch (error) {
        console.error('Error saving video:', error);
        Alert.alert(t('common.error'), t('cameraLive.unableToSaveVideo'));
        setIsRecording(false);
        setRecordingStartTime(null);

        // Clean up any temporary files
        try {
          await recordingService.cleanSandbox();
        } catch (cleanError) {
          console.error('Error cleaning sandbox:', cleanError);
        }
      }
    }
  }, [isRecording, recordingStartTime, t]);

  const handleClose = () => {
    navigation.goBack();
  };

  const renderQualityModal = () => {
    if (!showQualityModal) {
      return null;
    }

    return (
      <View style={styles.qualityModalOverlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeQualityModal}>
          <Animated.View
            style={[
              styles.qualityModalBackdrop,
              {
                opacity: opacityAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('cameraLive.selectResolution')}</Text>
            <TouchableOpacity onPress={closeQualityModal}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={STREAM_QUALITIES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.qualityItem,
                  currentQuality.value === item.value && styles.qualityItemActive,
                ]}
                onPress={() => changeQuality(item)}
              >
                <View style={styles.qualityInfo}>
                  <Text
                    style={[
                      styles.qualityText,
                      currentQuality.value === item.value && styles.qualityTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.qualityResolution}>{item.resolution}</Text>
                </View>
                {currentQuality.value === item.value && (
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    );
  };

  const renderVideoPlayer = () => {
    if (videoError && !isLoading) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>{t('cameraLive.videoLoadingFailed')}</Text>
          <Text style={styles.errorText}>{videoError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryStream}>
            <Icon name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryButtonText}>{t('cameraLive.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!streamUrl) {
      return (
        <View style={styles.loadingContainer}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </>
          ) : (
            <>
              <Icon name="camera-off" size={64} color="#6B7280" />
              <Text style={styles.loadingText}>{t('cameraLive.cameraNotConnected')}</Text>
            </>
          )}
        </View>
      );
    }

    return (
      <>
        <Video
          ref={videoRef}
          source={{
            uri: streamUrl,
            type: 'm3u8',
          }}
          style={styles.video}
          resizeMode="contain"
          repeat
          paused={false}
          muted={isMuted}
          playInBackground={false}
          playWhenInactive={false}
          useTextureView={Platform.OS === 'android'}
          onLoad={handleVideoLoad}
          onError={handleVideoError}
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onBuffer={({ isBuffering }) => {
            console.log('Video buffering:', isBuffering);
          }}
          ignoreSilentSwitch="ignore"
          mixWithOthers="mix"
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}
      </>
    );
  };

  // Render Fullscreen Mode with Landscape Simulation
  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={exitFullscreen}
        statusBarTranslucent
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar hidden />
          {/* Rotated Container to simulate landscape */}
          <View style={styles.landscapeWrapper}>
            <View
              ref={videoContainerRef}
              style={styles.fullscreenVideoContainer}
              collapsable={false}
            >
              {renderVideoPlayer()}

              {/* Fullscreen Top Overlay */}
              <View style={styles.topOverlay}>
                <View style={styles.topLeft}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveRedDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                  <View style={styles.bitrateIndicator}>
                    <Icon name="wifi" size={12} color="#FFF" />
                    <Text style={styles.bitrateText}>{bitrate}kb/s</Text>
                  </View>
                  <TouchableOpacity style={styles.hdBadge} onPress={openQualityModal}>
                    <Text style={styles.hdText}>{currentQuality.label}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Fullscreen Right Controls */}
              <View style={styles.fullscreenRightControls}>
                <TouchableOpacity style={styles.controlButton} onPress={() => setIsMuted(!isMuted)}>
                  <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={22} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={takeSnapshot}>
                  <Icon name="camera" size={22} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleRecording}>
                  <Icon
                    name={isRecording ? 'stop-circle' : 'record-circle'}
                    size={22}
                    color={isRecording ? '#EF4444' : '#FFF'}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleTalk}>
                  <Icon name="microphone" size={22} color={isTalking ? '#4CAF50' : '#FFF'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.exitFullscreenButton]}
                  onPress={exitFullscreen}
                >
                  <Icon name="fullscreen-exit" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Watermark */}
              <View style={styles.watermark}>
                <LogoDetail />
              </View>
            </View>
          </View>
          {renderQualityModal()}
        </View>
      </Modal>
    );
  }

  // Render normal portrait mode
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.videoWrapper}>
        <View ref={videoContainerRef} style={styles.videoContainer} collapsable={false}>
          {renderVideoPlayer()}

          <View style={styles.topOverlay}>
            <View style={styles.topLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveRedDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
              <View style={styles.bitrateIndicator}>
                <Icon name="wifi" size={12} color="#FFF" />
                <Text style={styles.bitrateText}>{bitrate}kb/s</Text>
              </View>
            </View>

            <View style={styles.hdStyle}>
              <TouchableOpacity
                style={styles.hdBadge}
                onPress={openQualityModal}
                activeOpacity={0.8}
              >
                <Text style={styles.hdText}>{currentQuality.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={requestFullscreen}>
              <Icon name="fullscreen" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.watermark}>
            <LogoDetail />
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoIconContainer}>
          <NoRecordingDataIcon />
        </View>
        <Text style={styles.infoText}>{t('cameraLive.thereIsNoRecordingData')}</Text>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.mainButton} onPress={toggleRecording}>
          <View style={[styles.iconCircle, isRecording && styles.iconCircleActive]}>
            <Icon name="video" size={28} color="#FFF" />
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.video')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={toggleTalk}>
          <View style={[styles.iconCircle, isTalking && styles.iconCircleActive]}>
            <Icon name="microphone" size={28} color="#FFF" />
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.call')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={takeSnapshot}>
          <View style={styles.iconCircle}>
            <Icon name="camera" size={28} color="#FFF" />
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.call')}</Text>
        </TouchableOpacity>
      </View>

      {renderQualityModal()}
    </SafeAreaView>
  );
};

export default CameraLiveView;
