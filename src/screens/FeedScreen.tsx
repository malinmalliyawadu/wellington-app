import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedPost } from '../components/FeedPost';
import { mockPosts } from '../data/mockPosts';
import { getUserById } from '../data/mockUsers';
import { getPlaceById } from '../data/mockPlaces';
import { colors } from '../theme/colors';

export function FeedScreen() {
  const insets = useSafeAreaInsets();

  const postsWithData = mockPosts
    .map((post) => {
      const user = getUserById(post.userId);
      const place = getPlaceById(post.placeId);
      if (!user || !place) return null;
      return { post, user, place };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={postsWithData}
        keyExtractor={(item) => item.post.id}
        renderItem={({ item }) => (
          <FeedPost post={item.post} user={item.user} place={item.place} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
