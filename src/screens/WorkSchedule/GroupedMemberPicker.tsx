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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Member, MemberRelationship } from '@/services/faceService';
import { scale } from '@utils/responsive';

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
  selectedItemsText = (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return '';
    const names = ids
      .map((id) => members.find((m) => m.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    return names.join(', ');
  },
  styles: styleProps,
}: GroupedMemberPickerProps) {
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

        <ScrollView style={modalStyles.scroll} showsVerticalScrollIndicator={false}>
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.relationshipId);
            const hasMembers = group.members.length > 0;

            return (
              <View key={group.relationshipId} style={modalStyles.group}>
                <TouchableOpacity
                  style={[styleProps.listParentContainer, modalStyles.groupHeader]}
                  onPress={() => (hasMembers ? toggleGroup(group.relationshipId) : null)}
                  activeOpacity={hasMembers ? 0.7 : 1}
                  disabled={!hasMembers}
                >
                  {hasMembers && (
                    <Icon
                      name={isExpanded ? 'chevron-down' : 'chevron-right'}
                      size={22}
                      color="#EAF1F7"
                      style={modalStyles.chevron}
                    />
                  )}
                  <Text style={styleProps.listParentLabel}>{group.relationshipName}</Text>
                  {hasMembers && (
                    <Text style={modalStyles.memberCount}>({group.members.length})</Text>
                  )}
                </TouchableOpacity>

                {isExpanded &&
                  group.members.map((member) => {
                    const isSelected = value.includes(member.id);
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styleProps.listChildContainer, modalStyles.memberItem]}
                        onPress={() => toggleMember(member.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styleProps.listChildLabel}>{member.name}</Text>
                        <Icon
                          name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={24}
                          color={isSelected ? '#2A9EC6' : 'rgba(234,241,247,0.5)'}
                        />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            );
          })}
        </ScrollView>

        <View style={modalStyles.footer}>
          <Text style={modalStyles.selectedText} numberOfLines={2}>
            {selectedItemsText(selectedIds)}
          </Text>
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginRight: 8,
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
  },
  selectedText: {
    color: 'rgba(234,241,247,0.7)',
    fontSize: scale(14),
  },
  saveBtn: {
    minWidth: 80,
    minHeight: 30,
  },
});
