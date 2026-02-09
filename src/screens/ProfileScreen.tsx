import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { currentUser } from '../data/mockUsers';
import { mockPosts, getPostsByUserId } from '../data/mockPosts';
import { getPlaceById } from '../data/mockPlaces';
import { useFollow } from '../context/FollowContext';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();

  const postCount = getPostsByUserId(currentUser.id).length || 12;
  const followerCount = 248; // mock

  // For demo, show posts from other users as if they were the current user's
  const userPosts = mockPosts.slice(0, 6).map((post) => {
    const place = getPlaceById(post.placeId);
    return { ...post, place };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
            <Text style={styles.displayName}>{currentUser.displayName}</Text>
            <Text style={styles.username}>@{currentUser.username}</Text>
            {currentUser.bio && (
              <Text style={styles.bio}>{currentUser.bio}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{postCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.stat}
                onPress={() =>
                  router.push({
                    pathname: '/profile/follow-list',
                    params: { userId: currentUser.id, tab: 'followers' },
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
                    pathname: '/profile/follow-list',
                    params: { userId: currentUser.id, tab: 'following' },
                  })
                }
              >
                <Text style={styles.statNumber}>{followingIds.length}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findPeopleButton}
                onPress={() => router.push('/profile/discover')}
              >
                <Text style={styles.findPeopleButtonText}>Find People</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Posts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postTile}>
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
                <Text style={styles.postPlace} numberOfLines={1}>{item.place.name}</Text>
              </View>
            )}
          </View>
        )}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  findPeopleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  findPeopleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
});
