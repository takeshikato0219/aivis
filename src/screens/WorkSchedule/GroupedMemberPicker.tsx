import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Member, MemberRelationship } from '@/services/faceService';
import { useTranslation } from 'react-i18next';
import { MemberAvatar } from '@/components/MemberAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './WorkSchedule.style';

const UNCATEGORIZED = '__uncategorized__';

function sortMembersAlphabetically(list: Member[]): Member[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

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
  const insets = useSafeAreaInsets();
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
          members: sortMembersAlphabetically(groups[r.id]?.members ?? []),
        };
      }),
      ...(Object.keys(groups).includes(UNCATEGORIZED) && groups[UNCATEGORIZED].members.length > 0
        ? [
            {
              relationshipId: UNCATEGORIZED,
              relationshipName: groups[UNCATEGORIZED].name,
              members: sortMembersAlphabetically(groups[UNCATEGORIZED].members),
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
        members: sortMembersAlphabetically(
          g.members.filter((m) => m.name.toLowerCase().includes(q))
        ),
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
      <View style={[styles.containerPicker, { paddingTop: insets.top }]}>
        <View style={styles.headerPicker}>
          <Text style={styles.title}>{placeholder}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#EAF1F7" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="rgba(234,241,247,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(234,241,247,0.5)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          removeClippedSubviews={Platform.OS !== 'android'}
        >
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.relationshipId);
            const hasMembers = group.members.length > 0;

            return (
              <View key={group.relationshipId} style={styles.group}>
                <TouchableOpacity
                  style={[
                    styleProps.listParentContainer,
                    styles.groupHeader,
                    isExpanded && styles.groupHeaderExpanded,
                  ]}
                  onPress={() => (hasMembers ? toggleGroup(group.relationshipId) : null)}
                  activeOpacity={hasMembers ? 0.7 : 1}
                  disabled={!hasMembers}
                >
                  <View style={styles.groupHeaderContent}>
                    <Text style={styleProps.listParentLabel}>{group.relationshipName}</Text>
                    {hasMembers && <Text style={styles.memberCount}>({group.members.length})</Text>}
                  </View>
                  {hasMembers && (
                    <View style={styles.iconSlot}>
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
                    style={styles.childScroll}
                    contentContainerStyle={styles.childScrollContent}
                    nestedScrollEnabled={Platform.OS === 'android'}
                    removeClippedSubviews={Platform.OS !== 'android'}
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
                          style={[styleProps.listChildContainer, styles.memberItem]}
                          onPress={() => toggleMember(member.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.memberInfo}>
                            <MemberAvatar
                              uri={avatarUri}
                              containerStyle={styles.memberAvatar}
                              imageStyle={styles.memberAvatar}
                              placeholderStyle={styles.memberAvatarPlaceholder}
                              loadingOverlayStyle={styles.memberAvatarLoading}
                              hiddenWhileLoadingStyle={styles.memberAvatarHidden}
                              iconColor="rgba(234,241,247,0.5)"
                              spinnerColor="#2A9EC6"
                            />
                            <Text style={styleProps.listChildLabel}>{member.name}</Text>
                          </View>
                          <View style={styles.iconSlot}>
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
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#2A9EC6" />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <ScrollView
            style={styles.footerTextContainer}
            contentContainerStyle={styles.footerTextContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.selectedText}>{selectedItemsText(selectedIds)}</Text>
            <Text style={styles.selectedCountText}>
              {t('workSchedule.selectedCount', { count: selectedIds.length })}
            </Text>
          </ScrollView>
          <Pressable style={[styleProps.button, styles.saveBtnPicker]} onPress={onClose}>
            <Text style={styleProps.text}>{saveButtonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
