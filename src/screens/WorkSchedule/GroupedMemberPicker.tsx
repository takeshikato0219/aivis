import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Member, MemberRelationship } from '@/services/faceService';
import { scale } from '@utils/responsive';
import { useTranslation } from 'react-i18next';
import { MemberAvatar } from '@/components/MemberAvatar';

const UNCATEGORIZED = '__uncategorized__';

type GroupedMembers = {
  relationshipId: string;
  relationshipName: string;
  members: Member[];
};

interface GroupedMemberPickerProps {
  members: Member[];
  relationships: MemberRelationship[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  onClose: () => void;
  searchPlaceholder?: string;
  saveButtonLabel?: string;
  otherLabel?: string;
  selectedItemsText?: (selectedIds: string[]) => string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  styles: {
    styleMultipleSelectRow: object;
    listParentContainer: object;
    listParentLabel: object;
    listChildContainer: object;
    listChildLabel: object;
    button: object;
    text: object;
  };
}

export function GroupedMemberPicker({
  members,
  relationships,
  value,
  onChange,
  placeholder,
  onClose,
  searchPlaceholder = 'Search',
  saveButtonLabel = 'Save',
  otherLabel = 'Other',
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  selectedItemsText = (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return '';
    const names = ids
      .map((id) => members.find((m) => m.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    return names.join(', ');
  },
  styles: styleProps,
}: GroupedMemberPickerProps) {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');

  const groupedData = useMemo((): GroupedMembers[] => {
    const groups: Record<string, { name: string; members: Member[] }> = {};

    relationships.forEach((r) => {
      const rel = r as { name?: string; name_trans?: string };
      groups[r.id] = { name: rel.name ?? rel.name_trans ?? '', members: [] };
    });
    groups[UNCATEGORIZED] = {
      name: otherLabel,
      members: [],
    };

    members.forEach((m) => {
      const parentId = m.relationship?.id ?? m.relationship_type_id ?? UNCATEGORIZED;
      if (!groups[parentId]) {
        groups[parentId] = { name: otherLabel, members: [] };
      }
      groups[parentId].members.push(m);
    });

    return [
      ...relationships.map((r) => {
        const rel = r as { name?: string; name_trans?: string };
        return {
          relationshipId: r.id,
          relationshipName: rel.name ?? rel.name_trans ?? '',
          members: groups[r.id]?.members ?? [],
        };
      }),
      ...(Object.keys(groups).includes(UNCATEGORIZED) && groups[UNCATEGORIZED].members.length > 0
        ? [
            {
              relationshipId: UNCATEGORIZED,
              relationshipName: groups[UNCATEGORIZED].name,
              members: groups[UNCATEGORIZED].members,
            },
          ]
        : []),
    ];
  }, [members, relationships, otherLabel]);

  const filteredGroups = useMemo(() => {
    if (!searchText.trim()) return groupedData;
    const q = searchText.toLowerCase().trim();
    return groupedData
      .map((g) => ({
        ...g,
        members: g.members.filter((m) => m.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.members.length > 0 || g.relationshipName.toLowerCase().includes(q));
  }, [groupedData, searchText]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const toggleMember = useCallback(
    (memberId: string) => {
      const exists = value.includes(memberId);
      if (exists) {
        onChange(value.filter((id) => id !== memberId));
      } else {
        onChange([...value, memberId]);
      }
    },
    [value, onChange]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const paddingToBottom = 60;
      const isNearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
      if (isNearBottom && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore]
  );

  const selectedIds = value ?? [];

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{placeholder}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Icon name="close" size={24} color="#EAF1F7" />
          </TouchableOpacity>
        </View>

        <View style={modalStyles.searchContainer}>
          <Icon name="magnify" size={20} color="rgba(234,241,247,0.6)" />
          <TextInput
            style={modalStyles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(234,241,247,0.5)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView
          style={modalStyles.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.relationshipId);
            const hasMembers = group.members.length > 0;

            return (
              <View key={group.relationshipId} style={modalStyles.group}>
                <TouchableOpacity
                  style={[
                    styleProps.listParentContainer,
                    modalStyles.groupHeader,
                    isExpanded && modalStyles.groupHeaderExpanded,
                  ]}
                  onPress={() => (hasMembers ? toggleGroup(group.relationshipId) : null)}
                  activeOpacity={hasMembers ? 0.7 : 1}
                  disabled={!hasMembers}
                >
                  <View style={modalStyles.groupHeaderContent}>
                    <Text style={styleProps.listParentLabel}>{group.relationshipName}</Text>
                    {hasMembers && (
                      <Text style={modalStyles.memberCount}>({group.members.length})</Text>
                    )}
                  </View>
                  {hasMembers && (
                    <View style={modalStyles.iconSlot}>
                      <Icon
                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                        size={22}
                        color="#EAF1F7"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {isExpanded && hasMembers && (
                  <ScrollView
                    style={modalStyles.childScroll}
                    contentContainerStyle={modalStyles.childScrollContent}
                    nestedScrollEnabled={Platform.OS === 'android'}
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                  >
                    {group.members.map((member) => {
                      const isSelected = value.includes(member.id);
                      const avatarUri = member.image ?? member.images?.[0]?.image_url;
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[styleProps.listChildContainer, modalStyles.memberItem]}
                          onPress={() => toggleMember(member.id)}
                          activeOpacity={0.7}
                        >
                          <View style={modalStyles.memberInfo}>
                            <MemberAvatar
                              uri={avatarUri}
                              containerStyle={modalStyles.memberAvatar}
                              imageStyle={modalStyles.memberAvatar}
                              placeholderStyle={modalStyles.memberAvatarPlaceholder}
                              loadingOverlayStyle={modalStyles.memberAvatarLoading}
                              hiddenWhileLoadingStyle={modalStyles.memberAvatarHidden}
                              iconColor="rgba(234,241,247,0.5)"
                              spinnerColor="#2A9EC6"
                            />
                            <Text style={styleProps.listChildLabel}>{member.name}</Text>
                          </View>
                          <View style={modalStyles.iconSlot}>
                            <Icon
                              name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={24}
                              color={isSelected ? '#2A9EC6' : 'rgba(234,241,247,0.5)'}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            );
          })}
          {onLoadMore && hasMore && loadingMore && (
            <View style={modalStyles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#2A9EC6" />
            </View>
          )}
        </ScrollView>

        <View style={modalStyles.footer}>
          <ScrollView
            style={modalStyles.footerTextContainer}
            contentContainerStyle={modalStyles.footerTextContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={modalStyles.selectedText}>{selectedItemsText(selectedIds)}</Text>
            <Text style={modalStyles.selectedCountText}>
              {t('workSchedule.selectedCount', { count: selectedIds.length })}
            </Text>
          </ScrollView>
          <Pressable style={[styleProps.button, modalStyles.saveBtn]} onPress={onClose}>
            <Text style={styleProps.text}>{saveButtonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F14',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234,241,247,0.16)',
  },
  title: {
    color: '#EAF1F7',
    fontSize: scale(18),
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#EAF1F7',
    fontSize: scale(15),
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
    marginTop: 12,
  },
  group: {
    marginBottom: 4,
  },
  loadMoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupHeaderExpanded: {
    backgroundColor: 'rgba(42, 158, 198, 0.25)',
  },
  groupHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCount: {
    marginLeft: 8,
    color: 'rgba(234,241,247,0.6)',
    fontSize: scale(14),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(16,14,14)',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    // Avoid black surface before decode / on some Android GPUs when remote Image fails silently
    backgroundColor: 'rgba(234,241,247,0.1)',
  },
  memberAvatarPlaceholder: {
    backgroundColor: 'rgba(234,241,247,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarHidden: {
    opacity: 0,
  },
  memberAvatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(234,241,247,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childScroll: {
    maxHeight: scale(280),
  },
  childScrollContent: {
    paddingBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(234,241,247,0.16)',
    backgroundColor: '#0B0F14',
    gap: 12,
  },
  footerTextContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxHeight: scale(70),
  },
  footerTextContent: {
    paddingRight: 4,
  },
  selectedText: {
    color: 'rgba(234,241,247,0.7)',
    fontSize: scale(14),
  },
  saveBtn: {
    minWidth: 80,
    minHeight: 30,
    flexShrink: 0,
  },
  selectedCountText: {
    color: 'rgb(255,255,255)',
    fontSize: scale(13),
    marginTop: 2,
  },
});
