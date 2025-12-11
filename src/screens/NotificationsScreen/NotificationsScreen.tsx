import React, { memo } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, List, Avatar, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './NotificationsScreen.styles';

const LeftIcon = memo(({ icon }: { icon: string }) => <Avatar.Icon icon={icon} size={40} />);

const RightTime = memo(({ time }: { time: string }) => (
  <Text variant="bodySmall" style={styles.timeText}>
    {time}
  </Text>
));

const renderLeftIcon = (icon: string) => (props: any) => <LeftIcon {...props} icon={icon} />;
const renderRightTime = (time: string) => (props: any) => <RightTime {...props} time={time} />;

// =============================================
// Main Screen
// =============================================
const NotificationsScreen = () => {
  const theme = useTheme();
  useAppSetup({ screenName: 'NotificationsScreen' });

  const notifications = [
    {
      id: '1',
      title: 'New message',
      description: 'You have a new message',
      time: '5 min ago',
      icon: 'message',
      unread: true,
    },
    {
      id: '2',
      title: 'Update available',
      description: 'New version available',
      time: '1 hour ago',
      icon: 'system-update',
      unread: true,
    },
    {
      id: '3',
      title: 'Welcome!',
      description: 'Thanks for joining',
      time: '2 days ago',
      icon: 'celebration',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard} elevation={2}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {unreadCount} unread
            </Text>
          </Card.Content>
        </Card>

        <Divider />

        {/* List */}
        <ScrollView style={styles.scrollContent}>
          {notifications.map((item) => (
            <Card
              key={item.id}
              style={[styles.notificationCard, item.unread && styles.unreadCard]}
              elevation={0}
            >
              <Card.Content>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={renderLeftIcon(item.icon)}
                  right={renderRightTime(item.time)}
                />
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
