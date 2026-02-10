import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { styles } from './FaceUpload.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import faceService, { Member } from '@api/faceService';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';

const ListFace = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { t } = useTranslation();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await faceService.getMembers();
      console.log(response);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const goToFaceUpload = () => {
    navigation.navigate('FaceUpload' as never);
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => navigation.navigate('DetailFace', { memberId: item.id })}
    >
      <View style={styles.memberContent}>
        <Icon name="face-recognition" size={24} color="#00ADD4" />
        <Text style={styles.memberName}>{item.name}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle}>{t('listFace.listFace')}</Text>
          </View>
          <TouchableOpacity onPress={goToFaceUpload}>
            <Icon name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Members List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="face-recognition" size={64} color="#888" />
              <Text style={styles.emptyText}>{t('listFace.noMembers') || 'No members found'}</Text>
              <Text style={styles.emptySubtext}>
                {t('listFace.addFirstMember') || 'Add your first member'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={renderMemberItem}
              contentContainerStyle={styles.membersList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ListFace;
