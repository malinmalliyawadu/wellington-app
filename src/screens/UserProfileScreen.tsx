import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFollow } from '../context/FollowContext';
import { useQuery } from '../hooks/useQuery';
import { getProfileById } from '../services/users';
import { getPostsByUserId as getPostsByUserIdAsync } from '../services/posts';
import { getPlaces } from '../services/places';
import { getFollowCounts } from '../services/follows';
import { FollowButton } from '../components/FollowButton';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { colors } from '../theme/colors';

export function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();

  const fetchUser = useCallback(() => getProfileById(userId), [userId]);
  const { data: user, loading: loadingUser } = useQuery(fetchUser);

  const fetchPosts = useCallback(() => getPostsByUserIdAsync(userId), [userId]);
  const { data: posts } = useQuery(fetchPosts);
  const { data: allPlaces } = useQuery(getPlaces);

  const fetchCounts = useCallback(() => getFollowCounts(userId), [userId]);
  const { data: counts } = useQuery(fetchCounts);

  const userPosts = useMemo(() => {
    if (!posts || !allPlaces) return [];
    const placeMap = new Map(allPlaces.map((p) => [p.id, p]));
    return posts.map((post) => ({
      ...post,
      place: placeMap.get(post.placeId),
    }));
  }, [posts, allPlaces]);

  if (loadingUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  const followerCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.stat}
                onPress={() =>
                  router.push({
                    pathname: `${tabBase}/follow-list`,
                    params: { userId, tab: 'followers' },
                  })
                }
              >
                <Text style={styles.statNumber}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.stat}
                onPress={() =>
                  router.push({
                    pathname: `${tabBase}/follow-list`,
                    params: { userId, tab: 'following' },
                  })
                }
              >
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <FollowButton userId={userId} />
            </View>

            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postTile}
            activeOpacity={0.8}
            onPress={() => router.push(`${tabBase}/post/${item.id}`)}
          >
            {item.mediaUrl ? (
              item.type === 'video' ? (
                <VideoThumbnail thumbnailUrl={item.thumbnailUrl} style={styles.postImage} />
              ) : (
                <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
              )
            ) : (
              <View style={styles.textPostTile}>
                <Text style={styles.textPostContent} numberOfLines={4}>
                  {item.content}
                </Text>
              </View>
            )}
            {item.place && (
              <View style={styles.postOverlay}>
                <Text style={styles.postPlace} numberOfLines={1}>
                  {item.place.name}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        contentContainerStyle={[styles.postsGrid, { paddingBottom: 60 + insets.bottom }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.gray200,
    marginBottom: 12,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray200,
  },
  actionRow: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    alignSelf: 'flex-start',
    marginTop: 28,
    marginBottom: 4,
  },
  postsGrid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  postTile: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  textPostTile: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  textPostContent: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  postPlace: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
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
