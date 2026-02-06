import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getOtherUsers } from '../data/mockUsers';
import { getPostsByUserId } from '../data/mockPosts';
import { useFollow } from '../context/FollowContext';
import { FollowButton } from '../components/FollowButton';
import { colors } from '../theme/colors';
import { TouchableOpacity } from 'react-native';
import type { FeedStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<FeedStackParamList, 'DiscoverUsers'>;

export function DiscoverUsersScreen() {
  const navigation = useNavigation<NavProp>();
  const { isFollowing } = useFollow();
  const otherUsers = getOtherUsers();

  // Show unfollowed users first, then followed users
  const sorted = [...otherUsers].sort((a, b) => {
    const aFollowed = isFollowing(a.id) ? 1 : 0;
    const bFollowed = isFollowing(b.id) ? 1 : 0;
    return aFollowed - bFollowed;
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigation.push('UserProfile', { userId: item.id })}
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
              <Text style={styles.postCount}>
                {getPostsByUserId(item.id).length} posts
              </Text>
            </View>
            <FollowButton userId={item.id} compact />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
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
