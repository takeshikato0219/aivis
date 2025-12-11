import React, { useState, useEffect } from 'react';
import { View, ScrollView, Appearance } from 'react-native';
import { Text, Card, Avatar, List, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { logout } from '@redux/slices/authSlice';
import Button from '@components/Button/Button';
import { useAppSetup } from '@hooks/useAppSetup';
import { ProfileScreenRouteProp } from '@navigation/types';
import { styles } from './ProfileScreen.styles';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const route = useRoute<ProfileScreenRouteProp>();
  const { user } = useAppSelector((state) => state.auth);

  // ✅ Track current theme
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useAppSetup({ screenName: 'ProfileScreen' });

  const { userId } = route.params || {};

  const renderThemeIcon = (props: any, isDarkMode: boolean) => (
    <List.Icon {...props} icon={isDarkMode ? 'moon-waning-crescent' : 'white-balance-sunny'} />
  );
  const renderEditProfileIcon = (props: any) => <List.Icon {...props} icon="account-edit" />;
  const renderSettingsIcon = (props: any) => <List.Icon {...props} icon="cog" />;
  const renderPrivacyIcon = (props: any) => <List.Icon {...props} icon="shield-account" />;
  const renderHelpIcon = (props: any) => <List.Icon {...props} icon="help-circle" />;
  const renderChevronIcon = (props: any) => <List.Icon {...props} icon="chevron-right" />;
  const renderThemeRight = (isDarkMode: boolean) => (
    <Text variant="titleLarge">{isDarkMode ? '🌙' : '☀️'}</Text>
  );

  useEffect(() => {
    // ✅ Listen to theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      console.log('[ProfileScreen] 🎨 Theme changed:', newColorScheme);
      setColorScheme(newColorScheme);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const isDarkMode = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.headerCard} elevation={2}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Avatar.Image
                size={80}
                source={{ uri: user?.avatar || 'https://i.pravatar.cc/150? img=1' }}
              />
              <View style={styles.userInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {user?.name || 'User Name'}
                </Text>
                <Text variant="bodyMedium" style={styles.email}>
                  {user?.email || 'user@example.com'}
                </Text>
                {userId && (
                  <Text variant="bodySmall" style={styles.userId}>
                    User ID: {userId}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* Menu Items */}
        <Card style={styles.card} elevation={1}>
          <Card.Content>
            <List.Item
              title="Theme"
              description={`System: ${isDarkMode ? 'Dark Mode' : 'Light Mode'}`}
              left={(props) => renderThemeIcon(props, isDarkMode)}
              right={() => renderThemeRight(isDarkMode)}
            />
            <Divider />

            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={renderEditProfileIcon}
              right={renderChevronIcon}
              onPress={() => console.log('Edit Profile')}
            />
            <Divider />
            <List.Item
              title="Settings"
              description="App preferences"
              left={renderSettingsIcon}
              right={renderChevronIcon}
              onPress={() => console.log('Settings')}
            />
            <Divider />
            <List.Item
              title="Privacy"
              description="Privacy settings"
              left={renderPrivacyIcon}
              right={renderChevronIcon}
              onPress={() => console.log('Privacy')}
            />
            <Divider />
            <List.Item
              title="Help & Support"
              description="Get help"
              left={renderHelpIcon}
              right={renderChevronIcon}
              onPress={() => console.log('Help')}
            />
          </Card.Content>
        </Card>

        <Button
          title="Logout"
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
