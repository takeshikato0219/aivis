import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { styles } from './FaceUpload.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import faceService, { Member, MemberRelationship } from '@/services/faceService';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';
import { MemberAvatar } from '@/components/MemberAvatar';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MEMBERS_PER_PAGE = 20;

const ListFace = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { t } = useTranslation();

  const [members, setMembers] = useState<Member[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasFetchedOnceRef = useRef(false);
  const [relationships, setRelationships] = useState<MemberRelationship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const fetchMembers = useCallback(
    async (page = 1, options?: { isRefresh?: boolean; silent?: boolean }) => {
      try {
        if (page === 1) {
          if (options?.isRefresh) {
            setRefreshing(true);
          } else if (!options?.silent) {
            setIsInitialLoading(true);
          }
          const response = await faceService.getMembers({ page: 1, per_page: MEMBERS_PER_PAGE });
          setMembers(response.data);
          setMembersPage(1);
          setHasMoreMembers(response.meta?.has_next ?? false);
        } else {
          setLoadingMoreMembers(true);
          const response = await faceService.getMembers({ page, per_page: MEMBERS_PER_PAGE });
          setMembers((prev) => [...prev, ...response.data]);
          setMembersPage(page);
          setHasMoreMembers(response.meta?.has_next ?? false);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setLoadingMoreMembers(false);
        setRefreshing(false);
        setIsInitialLoading(false);
      }
    },
    []
  );

  const loadMoreMembers = useCallback(async () => {
    if (loadingMoreMembers || !hasMoreMembers || refreshing) return;
    await fetchMembers(membersPage + 1);
  }, [fetchMembers, membersPage, hasMoreMembers, loadingMoreMembers, refreshing]);

  const onRefresh = useCallback(() => {
    fetchMembers(1, { isRefresh: true });
  }, [fetchMembers]);

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
      fetchMembers(1, { silent: hasFetchedOnceRef.current });
      hasFetchedOnceRef.current = true;
    }, [fetchMembers])
  );

  const openModal = () => {
    setShowModal(true);
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
    });
  };

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
            <MemberAvatar
              uri={item.image ?? item.images?.[0]?.image_url}
              containerStyle={styles.avatar}
              imageStyle={styles.avatar}
              placeholderStyle={styles.placeholder}
              loadingOverlayStyle={styles.loading}
              hiddenWhileLoadingStyle={styles.hidden}
              iconColor="rgba(0,173,212,0.5)"
              spinnerColor="#00ADD4"
            />
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
        {showModal && (
          <View style={styles.modalContainer} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={closeModal}>
              <Animated.View style={[styles.styleBackdrop, { opacity: opacityAnim }]} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}
              pointerEvents="box-none"
            >
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
            </Animated.View>
          </View>
        )}
        {/* Members List */}
        <View style={styles.listContainer}>
          {isInitialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={renderMemberItem}
              contentContainerStyle={styles.membersList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#4CAF50"
                  colors={['#4CAF50']}
                />
              }
              onEndReached={loadMoreMembers}
              onEndReachedThreshold={0.35}
              ListFooterComponent={
                loadingMoreMembers ? (
                  <View style={styles.listFooterLoading}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="face-recognition" size={64} color="#888" />
                  <Text style={styles.emptyText}>
                    {t('listFace.noMembers') || 'No members found'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {t('listFace.addFirstMember') || 'Add your first member'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ListFace;
