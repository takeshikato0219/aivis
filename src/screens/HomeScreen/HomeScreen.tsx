import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text, Card, Divider, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { logout } from '@redux/slices/authSlice';
import Button from '@components/Button/Button';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './HomeScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreenNavigationProp } from '@navigation/types';

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  // USING COMMON HOOKS
  useAppSetup({ screenName: 'HomeScreen' });

  // Memoize the safe area style to avoid inline style lint error
  const safeAreaStyle = React.useMemo(
    () => ({ flex: 1, backgroundColor: theme.colors.background }),
    [theme.colors.background]
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={safeAreaStyle} edges={['top', 'left', 'right']}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          {/* Header Card */}
          <Card style={styles.headerCard} elevation={2}>
            <Card.Content>
              <View style={styles.headerContent}>
                <Avatar.Icon
                  size={64}
                  icon="account-circle"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <View style={styles.headerText}>
                  <Text variant="headlineSmall" style={styles.welcomeText}>
                    Welcome Back!
                  </Text>
                  {user && (
                    <Text variant="bodyMedium" style={styles.userText}>
                      {user.name || user.email}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Quick Actions */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Quick Actions
              </Text>

              <Button
                title="Design Components"
                icon="palette"
                mode="contained"
                onPress={() => navigation.navigate('Demo' as never)}
                style={styles.actionButton}
              />

              <Button
                title="Profile Settings"
                icon="account-cog"
                mode="outlined"
                onPress={() => console.log('Profile')}
                style={styles.actionButton}
              />

              <Button
                title="Notifications"
                icon="bell"
                mode="text"
                onPress={() => navigation.navigate('NotificationsTab')}
                style={styles.actionButton}
              />
            </Card.Content>
          </Card>

          {/* Statistics */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Statistics
              </Text>

              <View style={styles.statsContainer}>
                <Card style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Card.Content style={styles.statContent}>
                    <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
                      24
                    </Text>
                    <Text variant="bodyMedium">Total</Text>
                  </Card.Content>
                </Card>

                <Card style={[styles.statCard, styles.statCardDone]}>
                  <Card.Content style={styles.statContent}>
                    <Text variant="displaySmall" style={styles.statTextDone}>
                      12
                    </Text>
                    <Text variant="bodyMedium">Done</Text>
                  </Card.Content>
                </Card>

                <Card style={[styles.statCard, styles.statCardPending]}>
                  <Card.Content style={styles.statContent}>
                    <Text variant="displaySmall" style={styles.statTextPending}>
                      5
                    </Text>
                    <Text variant="bodyMedium">Pending</Text>
                  </Card.Content>
                </Card>
              </View>
            </Card.Content>
          </Card>

          {/* Recent Activity */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Recent Activity
              </Text>

              {[1, 2, 3].map((item) => (
                <Card key={item} style={styles.activityItem} mode="outlined">
                  <Card.Content>
                    <View style={styles.activityRow}>
                      <Avatar.Icon size={40} icon="file-document" />
                      <View style={styles.activityText}>
                        <Text variant="bodyLarge">Task #{item} completed</Text>
                        <Text variant="bodySmall" style={styles.activityTime}>
                          2 hours ago
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>

          {/* Logout Button */}
          <Button
            title="Logout"
            icon="logout"
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
