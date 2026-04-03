import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { logout } from '@redux/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { styles } from './DrawerMenu.styles';
import DeviceInfo from 'react-native-device-info';
import HomeBackgroundImage from '@assets/webp/home-background.webp';
import { removeAuthData } from '@utils/authStorage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ isOpen, onClose, avatarUrl }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(isOpen);
  const navigation = useNavigation();
  const [avatarError, setAvatarError] = useState(false);
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  // RESPONSIVE DRAWER WIDTH
  const getDrawerWidth = () => {
    const isPad = Platform.OS === 'ios' && Math.min(width, height) >= 768;

    if (isPad) {
      return isLandscape ? 380 : 340;
    }
    return 300;
  };

  const [drawerWidth, setDrawerWidth] = React.useState(getDrawerWidth());
  const drawerAnim = useRef(new Animated.Value(drawerWidth)).current;

  // HANDLE ORIENTATION CHANGE
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const newWidth = getDrawerWidth();
      setDrawerWidth(newWidth);
    });

    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OPEN/CLOSE ANIMATION (RIGHT TO LEFT)
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.spring(drawerAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(drawerAnim, {
        toValue: drawerWidth,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, drawerWidth]);

  useEffect(() => {
    if (!isOpen) {
      drawerAnim.setValue(drawerWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerWidth]);

  // HANDLE LOGOUT
  const handleLogout = async () => {
    try {
      onClose();
      await removeAuthData();
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(logout());
    }
  };

  // MENU ITEMS
  const menuItems = [
    {
      icon: '🏠',
      label: t('drawer.home'),
      onPress: () => {
        onClose();
      },
    },
    {
      icon: '⚙️',
      label: t('drawer.settings'),
      onPress: () => {
        navigation.navigate('Setting' as any);
        onClose();
      },
    },
    {
      icon: '👤',
      label: t('drawer.profile'),
      onPress: () => {
        navigation.navigate('Profile' as any);
        onClose();
      },
    },
    {
      icon: '🚪',
      label: t('drawer.logout'),
      onPress: handleLogout,
      danger: true,
    },
  ];

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay} />

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [{ translateX: drawerAnim }],
          },
        ]}
      >
        <ImageBackground
          source={HomeBackgroundImage}
          style={styles.drawerSafeArea}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'right', 'bottom']}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              {avatarUrl && !avatarError ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <Icon name="account" size={50} color="#00ADD4" style={styles.avatar} />
              )}
              <View style={styles.drawerUserInfo}>
                <Text style={styles.drawerUserName} numberOfLines={1}>
                  {user?.name || '鈴木 花子'}
                </Text>
                <Text style={styles.drawerUserEmail} numberOfLines={1}>
                  {user?.email || 'hanako@example.com'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu Items */}
            {isLandscape ? (
              <ScrollView style={styles.menuList} contentContainerStyle={styles.menuListContent}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, item.danger && styles.menuItemDanger]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.menuList}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, item.danger && styles.menuItemDanger]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Footer */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerText}>Version {DeviceInfo.getVersion()}</Text>
              <Text style={styles.footerText}>© 2025 Your Company</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

export default DrawerMenu;
