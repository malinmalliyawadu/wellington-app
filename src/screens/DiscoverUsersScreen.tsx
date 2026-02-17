import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFollow } from '../context/FollowContext';
import { useAuth } from '../context/AuthContext';
import { FollowButton } from '../components/FollowButton';
import { colors } from '../theme/colors';
import { Pressable } from 'react-native';
import { useQuery } from '../hooks/useQuery';
import { getOtherProfiles } from '../services/users';
import { HapticPressable } from 'src/components/HapticPressable';

export function DiscoverUsersScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { isFollowing } = useFollow();
  const { profile } = useAuth();

  const fetchUsers = useCallback(() => getOtherProfiles(profile?.id ?? ''), [profile?.id]);
  const { data: otherUsers, loading } = useQuery(fetchUsers, profile?.id);
  const allUsers = otherUsers ?? [];

  // Show unfollowed users first, then followed users
  const sorted = useMemo(() => [...allUsers].sort((a, b) => {
    const aFollowed = isFollowing(a.id) ? 1 : 0;
    const bFollowed = isFollowing(b.id) ? 1 : 0;
    return aFollowed - bFollowed;
  }), [allUsers, isFollowing]);

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HapticPressable
            style={styles.userRow}
            onPress={() => router.push(`${tabBase}/user/${item.id}`)}
          >
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{item.displayName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
            </View>
            <FollowButton userId={item.id} compact />
          </HapticPressable>
        )}
        contentContainerStyle={[styles.list, { paddingTop: headerHeight, paddingBottom: 8 + insets.bottom }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  postCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
