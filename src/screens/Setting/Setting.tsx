import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './Setting.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { checkAuthAsync, refreshTokenAsync } from '@redux/slices/authSlice';
import authService from '@api/authService';
import HomeBackgroundImage from '@assets/png/home-background.png';
import { HomeScreenNavigationProp } from '@navigation/types';
import BackIcon from '@assets/svg/icon-back.svg';
import LineSubscriptionService, { LineSubscriptionStatus } from '@api/lineSubscriptionService';
import lineAuthService from '@api/lineAuthService';
import Line from '@xmartlabs/react-native-line';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Setting = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // LINE Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<LineSubscriptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const goBack = () => {
    navigation.goBack();
  };

  const loadSubscriptionStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const isUserLoggedInWithLine = !!user?.line_user_id; // Check if user authenticated with LINE

      if (isUserLoggedInWithLine) {
        const isLineLoggedIn = await checkLineLoginStatus();

        if (isLineLoggedIn) {
          const status = await LineSubscriptionService.checkSubscriptionStatus();
          setSubscriptionStatus(status);
        } else {
          setSubscriptionStatus(null);
        }
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setSubscriptionStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [user?.line_user_id]);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptionStatus();
    }, [loadSubscriptionStatus])
  );

  const checkLineLoginStatus = async (): Promise<boolean> => {
    try {
      return await LineSubscriptionService.isSignedIn();
    } catch (error) {
      console.error('Error checking LINE login status:', error);
      return false;
    }
  };

  const updateUserWithLineId = async (): Promise<boolean> => {
    try {
      const lineProfile = await Line.getProfile();
      console.log(lineProfile);
      if (!lineProfile?.userId) {
        throw new Error('Unable to get LINE user profile');
      }

      try {
        await authService.updateProfile({
          line_user_id: lineProfile.userId,
        });
      } catch (updateError: any) {
        if (updateError.statusCode === 401 && refreshToken) {
          try {
            await dispatch(refreshTokenAsync({ refreshToken })).unwrap();
            await authService.updateProfile({
              line_user_id: lineProfile.userId,
            });
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
          }
        } else {
          throw updateError;
        }
      }

      await dispatch(checkAuthAsync()).unwrap();

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  };

  const handleSubscribeToLine = async () => {
    setIsSubscribing(true);
    try {
      const isUserLoggedInWithLine = !!user?.line_user_id;

      if (isUserLoggedInWithLine) {
        const isLineLoggedIn = await checkLineLoginStatus();

        if (!isLineLoggedIn) {
          Alert.alert(
            t('lineSubscription.lineSdkLoginRequired'),
            t('lineSubscription.lineSdkLoginRequiredMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('lineSubscription.loginWithLine'),
                onPress: async () => {
                  try {
                    const loginResult = await lineAuthService.signIn();
                    if (loginResult) {
                      await performSubscription();
                    }
                  } catch (loginError) {
                    console.error('Error logging in with LINE:', loginError);
                    setIsSubscribing(false);
                  }
                },
              },
            ]
          );
          setIsSubscribing(false);
          return;
        }

        await performSubscription();
      } else {
        Alert.alert(
          t('lineSubscription.lineAuthRequired'),
          t('lineSubscription.lineAuthRequiredMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('lineSubscription.loginWithLine'),
              onPress: async () => {
                try {
                  const loginResult = await lineAuthService.signIn();
                  if (loginResult) {
                    const updateSuccess = await updateUserWithLineId();
                    if (updateSuccess) {
                      await performSubscription();
                    } else {
                      Alert.alert(
                        t('common.error'),
                        'Failed to update user profile. Please try again.'
                      );
                      setIsSubscribing(false);
                    }
                  } else {
                    setIsSubscribing(false);
                  }
                } catch (loginError) {
                  console.error('Error logging in with LINE:', loginError);
                  setIsSubscribing(false);
                }
              },
            },
          ]
        );
        setIsSubscribing(false);
        return;
      }
    } catch (error) {
      console.error('Error subscribing to LINE:', error);
      setIsSubscribing(false);
    }
  };

  const performSubscription = async () => {
    try {
      const success = await LineSubscriptionService.subscribeToOfficialAccount();
      if (success) {
        setSubscriptionStatus((prev) =>
          prev ? { ...prev, isSubscribed: true } : { isSubscribed: true }
        );
        await loadSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error performing subscription:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribeFromLine = async () => {
    if (!user?.line_user_id) {
      Alert.alert(
        t('lineSubscription.lineAuthRequired'),
        t('lineSubscription.cannotUnsubscribeMessage')
      );
      return;
    }

    Alert.alert(t('lineSubscription.lineOfficialAccount'), t('common.areYouSure'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lineSubscription.unsubscribeFromLine'),
        style: 'destructive',
        onPress: async () => {
          setIsUnsubscribing(true);
          try {
            const success = await LineSubscriptionService.unsubscribeFromOfficialAccount();
            if (success) {
              setSubscriptionStatus((prev) =>
                prev ? { ...prev, isSubscribed: false } : { isSubscribed: false }
              );
            }
          } catch (error) {
            console.error('Error unsubscribing from LINE:', error);
          } finally {
            setIsUnsubscribing(false);
          }
        },
      },
    ]);
  };

  const handleOpenOfficialAccount = () => {
    void LineSubscriptionService.openOfficialAccount();
  };

  const goToFaceUpload = () => {
    navigation.navigate('FaceUpload');
  };

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <BackIcon />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t('drawer.setting')}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.settingItem} onPress={goToFaceUpload}>
              <View style={styles.settingLeft}>
                <Icon name="face-recognition" size={24} color="#00ADD4" />
                <Text style={styles.settingText}>{t('faceUpload.title')}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#FFF" />
            </TouchableOpacity>
            {/* LINE Official Account Section */}
            <View style={styles.section}>
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {!subscriptionStatus?.isSubscribed ? (
                  <TouchableOpacity
                    style={[styles.lineButton, styles.subscribeButton]}
                    onPress={handleSubscribeToLine}
                    disabled={isSubscribing || isLoadingStatus}
                  >
                    {isSubscribing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>{t('lineSubscription.subscribeToLine')}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.lineButton, styles.unsubscribeButton]}
                    onPress={handleUnsubscribeFromLine}
                    disabled={isUnsubscribing || isLoadingStatus}
                  >
                    {isUnsubscribing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {t('lineSubscription.unsubscribeFromLine')}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.lineButton, styles.openAccountButton]}
                  onPress={handleOpenOfficialAccount}
                >
                  <Text style={styles.buttonText}>{t('lineSubscription.openOfficialAccount')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Setting;
