import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { getPlaces } from "../services/places";
import { getPosts } from "../services/posts";
import { getProfiles } from "../services/users";
import { getUpcomingEvents } from "../services/events";
import { EventCard } from "../components/EventCard";
import { HapticPressable } from "../components/HapticPressable";
import type { Place, Post, User, Event, PlaceCategory } from "../types";

const TRENDING_SEARCHES = [
  "Coffee",
  "Brunch",
  "Craft beer",
  "Live music",
  "Waterfront",
  "Cuban Street",
];

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  attraction: "compass",
  park: "leaf",
  venue: "musical-notes",
};

interface SearchResult {
  id: string;
  type: "place" | "post" | "user" | "event";
  data: Place | Post | User | Event;
}

interface TrendingPlace extends Place {
  postCount: number;
}

interface SearchScreenProps {
  query?: string;
  onQueryChange?: (query: string) => void;
}

export function SearchScreen({ query = "", onQueryChange }: SearchScreenProps) {
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  // Fetch all data
  const { data: places } = useQuery(getPlaces);
  const { data: posts } = useQuery(getPosts);
  const { data: users } = useQuery(getProfiles);
  const { data: events } = useQuery(getUpcomingEvents);

  // Compute trending places (places with most posts)
  const trendingPlaces = useMemo(() => {
    if (!places || !posts) return [];

    const placePostCounts = new Map<string, number>();
    posts.forEach((post) => {
      const count = placePostCounts.get(post.placeId) || 0;
      placePostCounts.set(post.placeId, count + 1);
    });

    return places
      .map((place) => ({
        ...place,
        postCount: placePostCounts.get(place.id) || 0,
      }))
      .filter((p) => p.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 6);
  }, [places, posts]);

  // Get upcoming events in next 2 days
  const upcomingEvents = useMemo(() => {
    if (!events) return [];

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= twoDaysFromNow;
      })
      .slice(0, 3);
  }, [events]);

  // Get places for events
  const eventPlaces = useMemo(() => {
    if (!upcomingEvents || !places) return new Map();
    const map = new Map(places.map((p) => [p.id, p]));
    return map;
  }, [upcomingEvents, places]);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || !places || !posts || !users || !events) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search places
    places.forEach((place) => {
      if (
        place.name.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q)
      ) {
        results.push({ id: `place-${place.id}`, type: "place", data: place });
      }
    });

    // Search posts (by content)
    posts.forEach((post) => {
      if (post.content.toLowerCase().includes(q)) {
        results.push({ id: `post-${post.id}`, type: "post", data: post });
      }
    });

    // Search users
    users.forEach((user) => {
      if (
        user.displayName.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.bio?.toLowerCase().includes(q)
      ) {
        results.push({ id: `user-${user.id}`, type: "user", data: user });
      }
    });

    // Search events
    events.forEach((event) => {
      if (
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q)
      ) {
        results.push({ id: `event-${event.id}`, type: "event", data: event });
      }
    });

    return results;
  }, [query, places, posts, users, events]);

  // Group search results by type
  const groupedResults = useMemo(() => {
    const sections = [];

    const placeResults = searchResults.filter((r) => r.type === "place");
    const userResults = searchResults.filter((r) => r.type === "user");
    const postResults = searchResults.filter((r) => r.type === "post");
    const eventResults = searchResults.filter((r) => r.type === "event");

    if (placeResults.length > 0) {
      sections.push({ title: "Places", data: placeResults });
    }
    if (userResults.length > 0) {
      sections.push({ title: "People", data: userResults });
    }
    if (postResults.length > 0) {
      sections.push({ title: "Posts", data: postResults.slice(0, 5) });
    }
    if (eventResults.length > 0) {
      sections.push({ title: "Events", data: eventResults });
    }

    return sections;
  }, [searchResults]);

  const handlePlacePress = (placeId: string) => {
    router.push(`/search/place/${placeId}`);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/search/user/${userId}`);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/search/post/${postId}`);
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/search/event/${eventId}`);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case "place": {
        const place = item.data as Place;
        return (
          <HapticPressable
            style={styles.resultItem}
            onPress={() => handlePlacePress(place.id)}
          >
            <View
              style={[
                styles.resultIcon,
                { backgroundColor: colors.category[place.category] },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[place.category]}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultTitle}>{place.name}</Text>
              <Text style={styles.resultSubtitle}>{place.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </HapticPressable>
        );
      }

      case "user": {
        const user = item.data as User;
        return (
          <HapticPressable
            style={styles.resultItem}
            onPress={() => handleUserPress(user.id)}
          >
            <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
            <View style={styles.resultText}>
              <Text style={styles.resultTitle}>{user.displayName}</Text>
              <Text style={styles.resultSubtitle}>@{user.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </HapticPressable>
        );
      }

      case "post": {
        const post = item.data as Post;
        const place = places?.find((p) => p.id === post.placeId);
        return (
          <HapticPressable
            style={styles.resultItem}
            onPress={() => handlePostPress(post.id)}
          >
            {post.mediaUrl && (
              <Image
                source={{ uri: post.mediaUrl }}
                style={styles.postThumbnail}
              />
            )}
            <View style={styles.resultText}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {post.content}
              </Text>
              {place && <Text style={styles.resultSubtitle}>{place.name}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </HapticPressable>
        );
      }

      case "event": {
        const event = item.data as Event;
        const place = eventPlaces.get(event.placeId);
        if (!place) return null;
        return (
          <View style={styles.eventCardWrapper}>
            <EventCard
              event={event}
              place={place}
              onPress={() => handleEventPress(event.id)}
            />
          </View>
        );
      }

      default:
        return null;
    }
  };

  if (query.trim()) {
    return (
      <View style={styles.container}>
        <SectionList
          sections={groupedResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={[
            styles.searchResults,
            { paddingTop: headerHeight },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for places, people, posts, or events
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Trending Searches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Searches</Text>
        <View style={styles.chipGrid}>
          {TRENDING_SEARCHES.map((search) => (
            <HapticPressable
              key={search}
              style={styles.trendingChip}
              onPress={() => onQueryChange?.(search)}
            >
              <Ionicons name="trending-up" size={14} color={colors.primary} />
              <Text style={styles.trendingText}>{search}</Text>
            </HapticPressable>
          ))}
        </View>
      </View>

      {/* Trending Places */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Nearby</Text>
        <View style={styles.placeGrid}>
          {trendingPlaces.map((place) => (
            <HapticPressable
              key={place.id}
              style={styles.placeCard}
              onPress={() => handlePlacePress(place.id)}
            >
              <View
                style={[
                  styles.placeIcon,
                  { backgroundColor: colors.category[place.category] },
                ]}
              >
                <Ionicons
                  name={CATEGORY_ICONS[place.category]}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.placeName} numberOfLines={1}>
                {place.name}
              </Text>
              <View style={styles.placeStats}>
                <Ionicons name="image" size={12} color={colors.textMuted} />
                <Text style={styles.placeCount}>{place.postCount}</Text>
              </View>
            </HapticPressable>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next 2 Days</Text>
          {upcomingEvents.map((event) => {
            const place = eventPlaces.get(event.placeId);
            if (!place) return null;
            return (
              <EventCard
                key={event.id}
                event={event}
                place={place}
                onPress={() => handleEventPress(event.id)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trendingText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  placeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
  },
  placeCard: {
    width: "31%",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  placeName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  placeStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  searchResults: {
    paddingBottom: 100,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.gray200,
  },
  postThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: colors.gray200,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  eventCardWrapper: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
