import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FeedPost } from '../components/FeedPost';
import { mockPosts } from '../data/mockPosts';
import { getUserById } from '../data/mockUsers';
import { getPlaceById } from '../data/mockPlaces';
import { useFollow } from '../context/FollowContext';
import { colors } from '../theme/colors';

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();

  const postsWithData = mockPosts
    .filter((post) => followingIds.includes(post.userId))
    .map((post) => {
      const user = getUserById(post.userId);
      const place = getPlaceById(post.placeId);
      if (!user || !place) return null;
      return { post, user, place };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const handlePressUser = (userId: string) => {
    router.push(`/feed/user/${userId}`);
  };

  const handlePressPlace = (placeId: string) => {
    router.push(`/feed/place/${placeId}`);
  };

  const handlePressPost = (postId: string) => {
    router.push(`/feed/post/${postId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={postsWithData}
        keyExtractor={(item) => item.post.id}
        renderItem={({ item }) => (
          <FeedPost
            post={item.post}
            user={item.user}
            place={item.place}
            onPressUser={handlePressUser}
            onPressPlace={handlePressPlace}
            onPressPost={handlePressPost}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptySubtitle}>
              Follow people to see their recommendations here
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={() => router.push('/feed/discover')}
            >
              <Text style={styles.discoverButtonText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
