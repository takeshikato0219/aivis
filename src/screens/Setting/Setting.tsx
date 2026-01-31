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
        // Case 1: User logged in with LINE (has line_user_id)
        // Check if currently signed in with LINE SDK for subscription status
        const isLineLoggedIn = await checkLineLoginStatus();

        if (isLineLoggedIn) {
          // Can check subscription status
          const status = await LineSubscriptionService.checkSubscriptionStatus();
          setSubscriptionStatus(status);
        } else {
          // User authenticated with LINE but not currently signed in with SDK
          // They can still subscribe but status is unknown
          setSubscriptionStatus(null);
        }
      } else {
        // Case 2: User logged in with other method (no line_user_id)
        // Cannot check subscription status, but can subscribe by logging in with LINE
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setSubscriptionStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [user?.line_user_id]);

  // Load LINE subscription status on component mount
  useEffect(() => {
    void loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Refresh subscription status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadSubscriptionStatus();
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
      // Get LINE user profile
      const lineProfile = await Line.getProfile();
      console.log(lineProfile);
      if (!lineProfile?.userId) {
        throw new Error('Unable to get LINE user profile');
      }

      // Update user profile with line_user_id
      try {
        await authService.updateProfile({
          line_user_id: lineProfile.userId,
        });
      } catch (updateError: any) {
        // If token expired (401), try to refresh token and retry
        if (updateError.statusCode === 401 && refreshToken) {
          try {
            await dispatch(refreshTokenAsync({ refreshToken })).unwrap();

            // Retry update profile with new token
            await authService.updateProfile({
              line_user_id: lineProfile.userId,
            });
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            throw updateError; // Re-throw original error
          }
        } else {
          throw updateError;
        }
      }

      // Refresh user data in Redux store
      await dispatch(checkAuthAsync()).unwrap();

      return true;
    } catch (error) {
      console.error('Error updating user with LINE ID:', error);
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
                      // Successfully logged in with LINE SDK, now subscribe
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
                    // Successfully logged in with LINE SDK
                    // Update user profile with LINE ID and refresh Redux store
                    const updateSuccess = await updateUserWithLineId();
                    if (updateSuccess) {
                      // Now subscribe to LINE
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
        // Immediately update state to reflect subscription
        setSubscriptionStatus((prev) =>
          prev ? { ...prev, isSubscribed: true } : { isSubscribed: true }
        );
        // Reload subscription status to ensure UI is updated correctly
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
            {/* LINE Official Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('lineSubscription.lineOfficialAccount')}</Text>
              <Text style={styles.sectionDescription}>
                {user?.line_user_id
                  ? t('lineSubscription.lineUserDescription')
                  : t('lineSubscription.otherUserDescription')}
              </Text>

              {/* Subscription Status */}
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>{t('lineSubscription.subscriptionStatus')}: </Text>
                {isLoadingStatus ? (
                  <View style={styles.statusWithIndicator}>
                    <ActivityIndicator size="small" color="#00ADD4" />
                    <Text style={styles.statusText}>{t('lineSubscription.checkingStatus')}</Text>
                  </View>
                ) : user?.line_user_id ? (
                  // User logged in with LINE - can show actual status
                  <Text
                    style={[
                      styles.statusText,
                      // eslint-disable-next-line react-native/no-inline-styles
                      { color: subscriptionStatus?.isSubscribed ? '#4CAF50' : '#FF6B6B' },
                    ]}
                  >
                    {subscriptionStatus?.isSubscribed
                      ? t('lineSubscription.subscribed')
                      : t('lineSubscription.notSubscribed')}
                  </Text>
                ) : (
                  // User logged in with other method - cannot check status
                  <Text style={styles.statusText}>{t('lineSubscription.statusUnknown')}</Text>
                )}
              </View>

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
