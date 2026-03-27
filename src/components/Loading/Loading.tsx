import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { styles } from '@screens/Notifications/Notifications.styles';

const Loading = () => {
  return (
    <View style={styles.loadingMoreContainer}>
      <ActivityIndicator />
    </View>
  );
};

export default Loading;
