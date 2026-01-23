import React, { memo } from 'react';
import { View, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { Text, Card, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './Notifications.styles';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation } from '@react-navigation/native';

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
const Notifications = () => {
  const navigation = useNavigation();
  useAppSetup({ screenName: 'Notifications' });

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

  return (
    <View style={styles.container}>
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>

            <View style={styles.viewTitle}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Notitications
              </Text>
            </View>
          </View>
          <View style={styles.content}>
            {/* Header */}
            {/*<Card style={styles.headerCard} elevation={2}>*/}
            {/*  <Card.Content>*/}
            {/*    <Text variant="headlineSmall" style={styles.title}>*/}
            {/*      Notifications*/}
            {/*    </Text>*/}
            {/*    <Text variant="bodyMedium" style={styles.subtitle}>*/}
            {/*      {unreadCount} unread*/}
            {/*    </Text>*/}
            {/*  </Card.Content>*/}
            {/*</Card>*/}

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
      </ImageBackground>
    </View>
  );
};

export default Notifications;
