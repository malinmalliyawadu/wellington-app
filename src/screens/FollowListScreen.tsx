import React, { useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserById, getOtherUsers } from '../data/mockUsers';
import { useFollow } from '../context/FollowContext';
import { FollowButton } from '../components/FollowButton';
import { colors } from '../theme/colors';
import { currentUser } from '../data/mockUsers';

export function FollowListScreen() {
  const router = useRouter();
  const { userId, tab: initialTab } = useLocalSearchParams<{ userId: string; tab: 'followers' | 'following' }>();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const { followingIds } = useFollow();

  const user = getUserById(userId);
  const otherUsers = getOtherUsers();

  // Mock followers/following lists
  // For the current user, "following" is the real followingIds
  // For other users, show a mock subset
  const getFollowingList = () => {
    if (userId === currentUser.id) {
      return followingIds.map(getUserById).filter(Boolean);
    }
    // Mock: other users follow a subset of users
    return otherUsers.slice(0, 3).map((u) => getUserById(u.id)).filter(Boolean);
  };

  const getFollowersList = () => {
    if (userId === currentUser.id) {
      // Mock: some users follow the current user
      return otherUsers.slice(0, 2).map((u) => getUserById(u.id)).filter(Boolean);
    }
    // Mock: show some users as followers
    return otherUsers.slice(1, 4).map((u) => getUserById(u.id)).filter(Boolean);
  };

  const listData = activeTab === 'following' ? getFollowingList() : getFollowersList();

  return (
    <View style={styles.container}>
      <Text style={styles.headerName}>
        {userId === currentUser.id ? 'You' : user?.displayName}
      </Text>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item!.id}
        renderItem={({ item }) => {
          if (!item) return null;
          const isCurrentUser = item.id === currentUser.id;
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => {
                if (!isCurrentUser) {
                  router.push(`${tabBase}/user/${item.id}`);
                }
              }}
            >
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              {!isCurrentUser && <FollowButton userId={item.id} compact />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users to show</Text>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: 8 + insets.bottom }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  list: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gray200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
