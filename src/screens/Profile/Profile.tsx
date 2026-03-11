import React from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { useNavigation } from '@react-navigation/native';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './Profile.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HomeBackgroundImage from '@assets/png/home-background.png';
import { HomeScreenNavigationProp } from '@navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '@redux/slices/authSlice';
import { removeAuthData } from '@utils/authStorage';
import BackIcon from '@assets/svg/icon-back.svg';

const Profile = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // USING COMMON HOOKS
  useAppSetup({ screenName: 'Profile' });

  const goToEditProfile = () => {
    navigation.navigate('EditProfile' as any);
  };

  const goToChangePassword = () => {
    navigation.navigate('ChangePassword' as any);
  };

  const goToSettings = () => {
    navigation.navigate('Setting' as any);
  };

  const handleLogout = async () => {
    try {
      await removeAuthData();
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(logout());
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const gotoPolicy = (type: string) => {
    navigation.navigate('Policy', { type });
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
              <Text style={styles.headerTitle}>{t('drawer.profile', 'Profile')}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Profile Info Section */}
            <View style={styles.profileCard}>
              {user?.avatar_url ? (
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="account" size={50} color="#00ADD4" />
                </View>
              )}

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <Text style={styles.userPhone}>{user?.phone}</Text>
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <TouchableOpacity style={styles.settingItem} onPress={goToEditProfile}>
                <View style={styles.settingLeft}>
                  <Icon name="account-edit" size={24} color="#00ADD4" />
                  <Text style={styles.settingText}>{t('profile.editProfile')}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={() => gotoPolicy('privacy')}>
                <View style={styles.settingLeft}>
                  <Icon name="shield-account" size={24} color="#00ADD4" />
                  <Text style={styles.settingText}>{t('profile.privacy')}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={() => gotoPolicy('terms')}>
                <View style={styles.settingLeft}>
                  <Icon name="dresser" size={24} color="#00ADD4" />
                  <Text style={styles.settingText}>{t('auth.termsOfUse')}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={goToChangePassword}>
                <View style={styles.settingLeft}>
                  <Icon name="lock" size={24} color="#00ADD4" />
                  <Text style={styles.settingText}>{t('profile.changePassword')}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={goToSettings}>
                <View style={styles.settingLeft}>
                  <Icon name="cog-outline" size={24} color="#00ADD4" />
                  <Text style={styles.settingText}>{t('profile.settings')}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={24} color="#FF5252" />
              <Text style={styles.logoutText}>{t('drawer.logout')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default Profile;
