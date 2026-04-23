import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
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
  Platform,
} from 'react-native';
import { styles } from './FaceUpload.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import faceService, { Member, MemberRelationship } from '@/services/faceService';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';
import { MemberAvatar, MEMBER_AVATAR_LIST_DECODE_MAX } from '@/components/MemberAvatar';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MEMBERS_PER_PAGE = 20;

function isCanceledRequestError(e: unknown): boolean {
  if (axios.isCancel(e)) return true;
  if (typeof e !== 'object' || e === null) return false;
  const err = e as { code?: string; name?: string };
  return err.code === 'ERR_CANCELED' || err.name === 'CanceledError';
}

type ListFaceMemberRowProps = {
  item: Member;
  relationship?: MemberRelationship;
  relationships: MemberRelationship[];
};

const ListFaceMemberRow = memo(function ListFaceMemberRow({
  item,
  relationship,
  relationships,
}: ListFaceMemberRowProps) {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.memberItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('DetailFace', { memberId: item.id, relationships })}
    >
      <View style={styles.memberContent}>
        <MemberAvatar
          uri={item.image ?? item.images?.[0]?.image_url}
          decodeMax={MEMBER_AVATAR_LIST_DECODE_MAX}
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
          {relationship && <Text style={styles.memberRelationship}>{relationship.name_trans}</Text>}
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );
});

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
  const pendingMemberFetchesRef = useRef<Set<AbortController>>(new Set());
  const [relationships, setRelationships] = useState<MemberRelationship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const abortAllMemberListRequests = useCallback(() => {
    pendingMemberFetchesRef.current.forEach((ac) => ac.abort());
    pendingMemberFetchesRef.current.clear();
  }, []);

  const fetchMembers = useCallback(
    async (page = 1, options?: { isRefresh?: boolean; silent?: boolean }) => {
      const ac = new AbortController();
      pendingMemberFetchesRef.current.add(ac);
      try {
        if (page === 1) {
          if (options?.isRefresh) {
            setRefreshing(true);
          } else if (!options?.silent) {
            setIsInitialLoading(true);
          }
          const response = await faceService.getMembers(
            { page: 1, per_page: MEMBERS_PER_PAGE },
            { signal: ac.signal }
          );
          setMembers(response.data);
          setMembersPage(1);
          setHasMoreMembers(response.meta?.has_next ?? false);
        } else {
          setLoadingMoreMembers(true);
          const response = await faceService.getMembers(
            { page, per_page: MEMBERS_PER_PAGE },
            { signal: ac.signal }
          );
          setMembers((prev) => [...prev, ...response.data]);
          setMembersPage(page);
          setHasMoreMembers(response.meta?.has_next ?? false);
        }
      } catch (error) {
        if (isCanceledRequestError(error)) return;
        console.error('Failed to fetch members:', error);
      } finally {
        pendingMemberFetchesRef.current.delete(ac);
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
      return () => {
        abortAllMemberListRequests();
      };
    }, [fetchMembers, abortAllMemberListRequests])
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

  const relationshipByTypeId = useMemo(() => {
    const m = new Map<string, MemberRelationship>();
    for (const r of relationships) {
      m.set(r.id, r);
    }
    return m;
  }, [relationships]);

  const renderMemberItem = useCallback(
    ({ item }: { item: Member }) => (
      <ListFaceMemberRow
        item={item}
        relationships={relationships}
        relationship={
          item.relationship_type_id
            ? relationshipByTypeId.get(item.relationship_type_id)
            : undefined
        }
      />
    ),
    [relationshipByTypeId, relationships]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.header, styles.listFaceScreenHeader]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle}>{t('listFace.listFace')}</Text>
          </View>
          <TouchableOpacity
            onPress={openModal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
        {showModal && (
          <View style={styles.modalContainer} pointerEvents="box-none">
            <TouchableWithoutFeedback
              onPress={closeModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
                <TouchableOpacity
                  onPress={closeModal}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {/* Options */}
              <View style={styles.styleOption}>
                <TouchableOpacity
                  style={styles.btnTakePhoto}
                  onPress={() => handleTakePhoto('capture')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={closeModal}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={8}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === 'android'}
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
