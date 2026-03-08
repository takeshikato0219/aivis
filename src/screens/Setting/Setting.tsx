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
import { checkAuthAsync, setUser } from '@redux/slices/authSlice';
import authService from '@api/authService';
import HomeBackgroundImage from '@assets/png/home-background.png';
import { HomeScreenNavigationProp } from '@navigation/types';
import BackIcon from '@assets/svg/icon-back.svg';
import LineSubscriptionService, { LineSubscriptionStatus } from '@api/lineSubscriptionService';
import lineAuthService from '@api/lineAuthService';
import Line from '@xmartlabs/react-native-line';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { setUserData } from '@utils/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LINE_PROFILE_KEY = 'lineProfile';

const Setting = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // LINE Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<LineSubscriptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);

  const goBack = () => {
    navigation.goBack();
  };

  const loadSubscriptionStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const isUserLoggedInWithLine = !!user?.line_user_id; // Check if user authenticated with LINE
      if (isUserLoggedInWithLine) {
        const status = await LineSubscriptionService.checkSubscriptionStatus();
        setSubscriptionStatus(status);
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
    const loadLineProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(LINE_PROFILE_KEY);
        if (storedProfile) {
          setLineProfile(JSON.parse(storedProfile));
        }
      } catch (e) {
        console.error('Failed to load LINE profile from storage', e);
      }
    };
    loadLineProfile();
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

  const updateUserWithLineId = async (userId: string): Promise<boolean> => {
    try {
      try {
        const response = await authService.linkLineAccount(userId);
        console.log(response);
      } catch (apiError: any) {
        console.error('linkLineAccount error:', apiError?.response?.data || apiError);
        return false;
      }
      await dispatch(checkAuthAsync()).unwrap();
      return true;
    } catch (error) {
      console.error('updateUserWithLineId error:', error);
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
                  const loginResult = await performSubscription();
                  if (loginResult?.userId) {
                    const updateSuccess = await updateUserWithLineId(lineProfile.userId);
                    if (!updateSuccess) {
                      Alert.alert(
                        t('common.error'),
                        t('lineSubscription.failedToUpdateUserProfilePleaseTryAgain')
                      );
                      setIsSubscribing(false);
                    }
                  } else {
                    Alert.alert(t('common.error'), t('lineSubscription.failedToGetIdToken'));
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
        try {
          const profile = await Line.getProfile();
          setLineProfile(profile);
          await AsyncStorage.setItem(LINE_PROFILE_KEY, JSON.stringify(profile));
          return profile;
        } catch (profileError) {
          console.error('Error updating LINE profile info:', profileError);
        }
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

  const buildUpdateData = () => {
    const updateData: any = {};
    updateData.has_followed_bot = false;

    return updateData;
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
            const updateData = buildUpdateData();
            const updatedUser = await authService.updateProfile(updateData);
            await setUserData(updatedUser);
            dispatch(setUser(updatedUser));
            setLineProfile(null);
            await AsyncStorage.removeItem(LINE_PROFILE_KEY);
          } catch (error) {
            console.error('Error unsubscribing from LINE:', error);
          } finally {
            setIsUnsubscribing(false);
          }
        },
      },
    ]);
  };

  const goToFaceUpload = () => {
    navigation.navigate('ListFace', { type: '' });
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
                {lineProfile && (
                  <View style={styles.marginLine}>
                    <Text style={styles.lineStyle}>
                      {t('lineSubscription.LINEDisplayName')}
                      {lineProfile.displayName}
                    </Text>
                    <Text style={styles.lineStyle}>
                      {t('lineSubscription.LINEUserID')} {lineProfile.userId}
                    </Text>
                  </View>
                )}
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
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Setting;
