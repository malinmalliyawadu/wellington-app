import React, { useMemo } from "react";
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
  "Cuba Street",
];

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  attraction: "compass",
  park: "leaf",
  venue: "musical-notes",
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafes",
  restaurant: "Restaurants",
  bar: "Bars",
  attraction: "Attractions",
  park: "Parks",
  venue: "Venues",
};

const ALL_CATEGORIES: PlaceCategory[] = [
  "cafe",
  "restaurant",
  "bar",
  "attraction",
  "park",
  "venue",
];

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

  const { data: places } = useQuery(getPlaces);
  const { data: posts } = useQuery(getPosts);
  const { data: users } = useQuery(getProfiles);
  const { data: events } = useQuery(getUpcomingEvents);

  // Trending places (most posts)
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
      .slice(0, 8);
  }, [places, posts]);

  // Upcoming events (next 2 days)
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

  const eventPlaces = useMemo(() => {
    if (!places) return new Map<string, Place>();
    return new Map(places.map((p) => [p.id, p]));
  }, [places]);

  // Place counts by category
  const categoryCounts = useMemo(() => {
    if (!places) return new Map<PlaceCategory, number>();
    const counts = new Map<PlaceCategory, number>();
    places.forEach((p) => {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return counts;
  }, [places]);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || !places || !posts || !users || !events) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    places.forEach((place) => {
      if (
        place.name.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q)
      ) {
        results.push({ id: `place-${place.id}`, type: "place", data: place });
      }
    });

    posts.forEach((post) => {
      if (post.content.toLowerCase().includes(q)) {
        results.push({ id: `post-${post.id}`, type: "post", data: post });
      }
    });

    users.forEach((user) => {
      if (
        user.displayName.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.bio?.toLowerCase().includes(q)
      ) {
        results.push({ id: `user-${user.id}`, type: "user", data: user });
      }
    });

    events.forEach((event) => {
      if (
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: `event-${event.id}`,
          type: "event",
          data: event,
        });
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

    if (placeResults.length > 0)
      sections.push({ title: "Places", data: placeResults });
    if (userResults.length > 0)
      sections.push({ title: "People", data: userResults });
    if (postResults.length > 0)
      sections.push({ title: "Posts", data: postResults.slice(0, 5) });
    if (eventResults.length > 0)
      sections.push({ title: "Events", data: eventResults });

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
                size={18}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultTitle}>{place.name}</Text>
              <Text style={styles.resultSubtitle}>{place.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
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
            <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
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
            {post.mediaUrl ? (
              <Image
                source={{ uri: post.mediaUrl }}
                style={styles.postThumbnail}
              />
            ) : (
              <View
                style={[styles.resultIcon, { backgroundColor: colors.gray200 }]}
              >
                <Ionicons
                  name="document-text"
                  size={18}
                  color={colors.gray400}
                />
              </View>
            )}
            <View style={styles.resultText}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {post.content}
              </Text>
              {place && <Text style={styles.resultSubtitle}>{place.name}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
          </HapticPressable>
        );
      }

      case "event": {
        const event = item.data as Event;
        const place = eventPlaces.get(event.placeId);
        if (!place) return null;
        return (
          <EventCard
            event={event}
            place={place}
            onPress={() => handleEventPress(event.id)}
          />
        );
      }

      default:
        return null;
    }
  };

  // Search results view
  if (query.trim()) {
    return (
      <View style={styles.container}>
        <SectionList
          sections={groupedResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <Text style={styles.sectionHeaderCount}>
                {section.data.length}
              </Text>
            </View>
          )}
          contentContainerStyle={[
            styles.searchResults,
            { paddingTop: headerHeight },
          ]}
          ListHeaderComponent={
            onQueryChange ? (
              <View style={styles.activeFilterBar}>
                <HapticPressable
                  style={styles.activeFilterChip}
                  onPress={() => onQueryChange("")}
                >
                  <Text style={styles.activeFilterText}>{query}</Text>
                  <Ionicons name="close" size={16} color={colors.primary} />
                </HapticPressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={colors.gray300} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for places, people, or events
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // Browse / discovery view
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      {/* Trending Searches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending</Text>
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

      {/* Browse by Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {ALL_CATEGORIES.map((cat) => (
            <HapticPressable
              key={cat}
              style={styles.categoryCard}
              onPress={() => onQueryChange?.(cat)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.category[cat] },
                ]}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat]}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</Text>
              <Text style={styles.categoryCount}>
                {categoryCounts.get(cat) ?? 0}
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      </View>

      {/* Popular Places */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Places</Text>
        {trendingPlaces.map((place) => (
          <HapticPressable
            key={place.id}
            style={styles.placeRow}
            onPress={() => handlePlacePress(place.id)}
          >
            <View
              style={[
                styles.placeRowIcon,
                { backgroundColor: colors.category[place.category] },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[place.category]}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.placeRowText}>
              <Text style={styles.placeRowName}>{place.name}</Text>
              <Text style={styles.placeRowAddress} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
            <View style={styles.placeRowMeta}>
              <Ionicons
                name="image-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.placeRowCount}>{place.postCount}</Text>
            </View>
          </HapticPressable>
        ))}
      </View>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Up</Text>
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

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  // Active filter bar
  activeFilterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Search results section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Trending chips
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

  // Category row
  categoryRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    alignItems: "center",
    width: 80,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Popular places list
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  placeRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeRowText: {
    flex: 1,
  },
  placeRowName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  placeRowAddress: {
    fontSize: 13,
    color: colors.textMuted,
  },
  placeRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  placeRowCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Search results
  searchResults: {
    paddingBottom: 100,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    borderRadius: 8,
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
    color: colors.textMuted,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
