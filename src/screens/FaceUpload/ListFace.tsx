import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { styles } from './FaceUpload.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import faceService, { Member, MemberRelationship } from '@api/faceService';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';

const ListFace = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { t } = useTranslation();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relationships, setRelationships] = useState<MemberRelationship[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await faceService.getMembers();
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const response = await faceService.getMemberRelationships();
        setRelationships(response);
      } catch (error) {
        console.error('Failed to fetch relationships:', error);
      }
    };
    fetchRelationships();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleTakePhoto = (type: string) => {
    closeModal();
    navigation.navigate('FaceUpload', { type: type });
  };

  const renderMemberItem = useCallback(
    ({ item }: { item: Member }) => {
      const relationship = relationships.find((rel) => rel.id === item.relationship_type_id);
      return (
        <TouchableOpacity
          style={styles.memberItem}
          onPress={() => navigation.navigate('DetailFace', { memberId: item.id, relationships })}
        >
          <View style={styles.memberContent}>
            <Icon name="face-recognition" size={24} color="#00ADD4" />
            <View>
              <Text style={styles.memberName}>{item.name}</Text>
              {relationship && (
                <Text style={styles.memberRelationship}>{relationship.name_trans}</Text>
              )}
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      );
    },
    [navigation, relationships]
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
          <TouchableOpacity onPress={openModal}>
            <Icon name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
        {modalVisible && (
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.styleBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Drag indicator */}
              <View style={styles.dragIndicator} />
              {/* Header */}
              <View style={styles.headerModal}>
                <Text style={styles.titleModal}>{t('listFace.selectFunction')}</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {/* Options */}
              <View style={styles.styleOption}>
                <TouchableOpacity
                  style={styles.btnTakePhoto}
                  onPress={() => handleTakePhoto('capture')}
                  activeOpacity={0.7}
                >
                  <View style={styles.viewTakePhoto}>
                    <Icon name="camera" size={28} color="#00ADD4" />
                  </View>
                  <View style={styles.modalFlex}>
                    <Text style={styles.textTakePhoto}>{t('listFace.takePhoto')}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#BBBBBB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnUploadPhoto}
                  onPress={() => handleTakePhoto('upload')}
                  activeOpacity={0.7}
                >
                  <View style={styles.viewBtnUploadPhoto}>
                    <Icon name="image" size={28} color="#00ADD4" />
                  </View>
                  <View style={styles.modalFlex}>
                    <Text style={styles.textUploadPhoto}>
                      {t('listFace.uploadPhotoFromLibrary')}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#BBBBBB" />
                </TouchableOpacity>
              </View>
              {/* Cancel Button */}
              <View style={styles.viewCancel}>
                <TouchableOpacity style={styles.btnCancel} onPress={closeModal} activeOpacity={0.7}>
                  <Text style={styles.textCancel}>
                    {t('register.cancel') || t('listFace.close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
