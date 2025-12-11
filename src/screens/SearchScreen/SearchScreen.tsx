import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, Searchbar, List, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './SearchScreen.styles';

const SearchScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const recentSearches = ['React Native', 'TypeScript'];
  const renderHistoryIcon = (props: any) => <List.Icon {...props} icon="history" />;

  useAppSetup({ screenName: 'SearchScreen' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.headerCard} elevation={2}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Search
            </Text>
            <Searchbar
              placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </Card.Content>
        </Card>

        <Divider />

        <ScrollView style={styles.scrollContent}>
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recent Searches
              </Text>
              {recentSearches.map((item) => (
                <List.Item key={item} title={item} left={renderHistoryIcon} />
              ))}
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;
