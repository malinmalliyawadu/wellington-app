import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useQuery } from "../hooks/useQuery";
import { getPlaces, findOrCreatePlace } from "../services/places";
import { getPosts } from "../services/posts";
import { getProfiles } from "../services/users";
import { getUpcomingEvents } from "../services/events";
import { getGuides } from "../services/guides";
import { searchGooglePlaces } from "../services/googlePlaces";
import { fonts } from "../theme/fonts";
import { EventCard } from "../components/EventCard";
import { GuideCard } from "../components/GuideCard";
import { HapticPressable } from "../components/HapticPressable";
import { getTrendingHashtags, searchHashtags } from "../services/hashtags";
import { QueryErrorState } from "../components/QueryErrorState";
import { formatNumber } from "../utils/formatNumber";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type {
  Place,
  Post,
  User,
  Event,
  Guide,
  PlaceCategory,
  Hashtag,
} from "../types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<
  PlaceCategory,
  { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafes",
  restaurant: "Restaurants",
  bar: "Bars",
  attraction: "Attractions",
  park: "Parks",
  venue: "Venues",
  trail: "Trails",
};

const ALL_CATEGORIES: PlaceCategory[] = [
  "cafe",
  "restaurant",
  "bar",
  "attraction",
  "park",
  "venue",
  "trail",
];

type FilterType =
  | "all"
  | "places"
  | "people"
  | "events"
  | "guides"
  | "hashtags";

const FILTER_CHIPS: {
  key: FilterType;
  label: string;
  icon: SFSymbol;
  fallback: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "all", label: "All", icon: "sparkle", fallback: "sparkles" },
  { key: "places", label: "Places", icon: "mappin", fallback: "location" },
  { key: "people", label: "People", icon: "person.fill", fallback: "person" },
  {
    key: "events",
    label: "Events",
    icon: "calendar",
    fallback: "calendar",
  },
  { key: "guides", label: "Guides", icon: "book.fill", fallback: "book" },
  {
    key: "hashtags",
    label: "Hashtags",
    icon: "number",
    fallback: "pricetag",
  },
];

const FILTER_TO_SECTION: Record<FilterType, string | null> = {
  all: null,
  places: "Places",
  people: "People",
  events: "Events",
  guides: "Guides",
  hashtags: "Hashtags",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: "place" | "post" | "user" | "event" | "hashtag" | "guide";
  data: Place | Post | User | Event | Omit<Place, "id"> | Hashtag | Guide;
  source?: "google";
}

interface SearchScreenProps {
  query?: string;
  onQueryChange?: (query: string) => void;
}

// ─── Shimmer Block ───────────────────────────────────────────────────────────

function ShimmerBlock({
  width,
  height,
  borderRadius = 8,
  style,
  colors,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  colors: Colors;
}) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.gray200,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function BrowseSectionHeader({
  title,
  onSeeAll,
  colors,
}: {
  title: string;
  onSeeAll?: () => void;
  colors: Colors;
}) {
  return (
    <View style={browseSectionHeaderStyles(colors).container}>
      <Text style={browseSectionHeaderStyles(colors).title}>{title}</Text>
      {onSeeAll && (
        <HapticPressable onPress={onSeeAll}>
          <Text style={browseSectionHeaderStyles(colors).seeAll}>See All</Text>
        </HapticPressable>
      )}
    </View>
  );
}

const browseSectionHeaderStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    seeAll: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });

// ─── Main Component ──────────────────────────────────────────────────────────

export function SearchScreen({ query = "", onQueryChange }: SearchScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Reset filter when query clears
  useEffect(() => {
    if (!query.trim()) {
      setActiveFilter("all");
    }
  }, [query]);

  // ─── Data Queries ────────────────────────────────────────────────────────

  const {
    data: places,
    error: placesError,
    refetch: refetchPlaces,
  } = useQuery(getPlaces, "places");
  const { data: posts } = useQuery(getPosts, "posts");
  const { data: users } = useQuery(getProfiles, "profiles");
  const { data: events } = useQuery(getUpcomingEvents, "events");
  const { data: trendingHashtags } = useQuery(
    getTrendingHashtags,
    "trending-hashtags"
  );
  const { data: guides } = useQuery(getGuides, "guides");

  // ─── Hashtag Search ──────────────────────────────────────────────────────

  const [hashtagResults, setHashtagResults] = useState<Hashtag[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed.startsWith("#") || trimmed.length < 2) {
      setHashtagResults([]);
      return;
    }

    let stale = false;
    const prefix = trimmed.slice(1);

    const timer = setTimeout(async () => {
      try {
        const results = await searchHashtags(prefix);
        if (!stale) setHashtagResults(results);
      } catch {
        if (!stale) setHashtagResults([]);
      }
    }, 200);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  // ─── Google Places Search ────────────────────────────────────────────────

  const [googleResults, setGoogleResults] = useState<Omit<Place, "id">[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [creatingPlaceId, setCreatingPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setGoogleResults([]);
      setGoogleLoading(false);
      return;
    }

    let stale = false;
    setGoogleLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchGooglePlaces(query);
        if (!stale) {
          setGoogleResults(results);
        }
      } catch (error) {
        if (!stale) {
          console.error("Google Places search error:", error);
          setGoogleResults([]);
        }
      } finally {
        if (!stale) {
          setGoogleLoading(false);
        }
      }
    }, 300);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  // ─── Navigation Handlers ─────────────────────────────────────────────────

  const handleGooglePlacePress = useCallback(
    async (placeData: Omit<Place, "id">) => {
      if (!placeData.googlePlaceId || creatingPlaceId) return;

      setCreatingPlaceId(placeData.googlePlaceId);
      try {
        const place = await findOrCreatePlace(placeData);
        router.push(`/search/place/${place.id}`);
      } catch (error) {
        console.error("Error creating place:", error);
      } finally {
        setCreatingPlaceId(null);
      }
    },
    [creatingPlaceId, router]
  );

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

  const handleGuidePress = (guideId: string) => {
    router.push(`/search/guide/${guideId}`);
  };

  const handleHashtagPress = (tagName: string) => {
    router.push(`/search/hashtag/${tagName}` as any);
  };

  // ─── Computed Data ───────────────────────────────────────────────────────

  const postCountByPlace = useMemo(() => {
    if (!posts) return new Map<string, number>();
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      counts.set(post.placeId, (counts.get(post.placeId) || 0) + 1);
    });
    return counts;
  }, [posts]);

  const trendingPlaces = useMemo(() => {
    if (!places) return [];

    return places
      .map((place) => ({
        ...place,
        postCount: postCountByPlace.get(place.id) || 0,
      }))
      .filter((p) => p.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 8);
  }, [places, postCountByPlace]);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];

    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= fiveDaysFromNow;
      })
      .slice(0, 6);
  }, [events]);

  const eventPlaces = useMemo(() => {
    if (!places) return new Map<string, Place>();
    return new Map(places.map((p) => [p.id, p]));
  }, [places]);

  // ─── Search Results ──────────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!query.trim() || !places || !posts || !users || !events) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    places.forEach((place) => {
      if (
        place.name.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q) ||
        CATEGORY_LABELS[place.category].toLowerCase().includes(q)
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

    (guides ?? []).forEach((guide) => {
      if (
        guide.title.toLowerCase().includes(q) ||
        guide.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `guide-${guide.id}`,
          type: "guide",
          data: guide,
        });
      }
    });

    return results;
  }, [query, places, posts, users, events, guides]);

  const groupedResults = useMemo(() => {
    const sections = [];

    // Hashtag results (from server search)
    const hashtagSectionResults: SearchResult[] = hashtagResults.map((h) => ({
      id: `hashtag-${h.id}`,
      type: "hashtag" as const,
      data: h,
    }));

    if (hashtagSectionResults.length > 0)
      sections.push({ title: "Hashtags", data: hashtagSectionResults });

    const placeResults = searchResults.filter((r) => r.type === "place");
    const userResults = searchResults.filter((r) => r.type === "user");
    const postResults = searchResults.filter((r) => r.type === "post");
    const eventResults = searchResults.filter((r) => r.type === "event");
    const guideResults = searchResults.filter((r) => r.type === "guide");

    // Deduplicate: skip Google results that already exist locally
    const localGooglePlaceIds = new Set(
      placeResults.map((r) => (r.data as Place).googlePlaceId).filter(Boolean)
    );

    const uniqueGoogleResults: SearchResult[] = googleResults
      .filter(
        (gp) => gp.googlePlaceId && !localGooglePlaceIds.has(gp.googlePlaceId)
      )
      .map((gp) => ({
        id: `google-${gp.googlePlaceId}`,
        type: "place" as const,
        data: gp,
        source: "google" as const,
      }));

    const allPlaceResults = [...placeResults, ...uniqueGoogleResults];

    if (allPlaceResults.length > 0 || googleLoading)
      sections.push({ title: "Places", data: allPlaceResults });
    if (userResults.length > 0)
      sections.push({ title: "People", data: userResults });
    if (postResults.length > 0)
      sections.push({ title: "Posts", data: postResults.slice(0, 5) });
    if (eventResults.length > 0)
      sections.push({ title: "Events", data: eventResults });
    if (guideResults.length > 0)
      sections.push({ title: "Guides", data: guideResults });

    return sections;
  }, [searchResults, googleResults, googleLoading, hashtagResults]);

  // Filtered sections based on active filter chip
  const filteredSections = useMemo(() => {
    if (activeFilter === "all") return groupedResults;
    const targetTitle = FILTER_TO_SECTION[activeFilter];
    return groupedResults.filter((s) => s.title === targetTitle);
  }, [groupedResults, activeFilter]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  }, []);

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const styles = createStyles(colors);

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case "hashtag": {
        const hashtag = item.data as Hashtag;
        return (
          <HapticPressable
            style={styles.resultItem}
            onPress={() => handleHashtagPress(hashtag.name)}
          >
            <View
              style={[
                styles.resultIconRect,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <SFIcon
                name="number"
                fallback="pricetag"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultTitle}>#{hashtag.name}</Text>
              <Text style={styles.resultSubtitle}>
                {formatNumber(hashtag.postCount)}{" "}
                {hashtag.postCount === 1 ? "post" : "posts"}
              </Text>
            </View>
            <SFIcon
              name="chevron.right"
              fallback="chevron-forward"
              size={16}
              color={colors.gray300}
            />
          </HapticPressable>
        );
      }

      case "place": {
        const isGoogle = item.source === "google";
        const place = item.data as Place & Omit<Place, "id">;
        const isCreating = isGoogle && creatingPlaceId === place.googlePlaceId;
        return (
          <HapticPressable
            style={styles.resultItem}
            onPress={() =>
              isGoogle
                ? handleGooglePlacePress(place)
                : handlePlacePress((place as Place).id)
            }
          >
            <View
              style={[
                styles.resultIconRect,
                { backgroundColor: colors.category[place.category] },
              ]}
            >
              <SFIcon
                name={CATEGORY_ICONS[place.category].sf}
                fallback={CATEGORY_ICONS[place.category].fallback}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.resultText}>
              <View style={styles.resultTitleRow}>
                <Text
                  style={[styles.resultTitle, { marginBottom: 0 }]}
                  numberOfLines={1}
                >
                  {place.name}
                </Text>
              </View>
              <Text style={styles.resultSubtitle} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
            {isCreating ? (
              <ShimmerBlock
                width={16}
                height={16}
                borderRadius={8}
                colors={colors}
              />
            ) : (
              <View style={styles.resultTrailing}>
                <View
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: colors.category[place.category] + "18",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: colors.category[place.category] },
                    ]}
                  >
                    {CATEGORY_LABELS[place.category]}
                  </Text>
                </View>
              </View>
            )}
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
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.userAvatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.resultText}>
              <Text style={styles.resultTitle}>{user.displayName}</Text>
              <Text style={styles.resultSubtitle}>@{user.username}</Text>
            </View>
            <SFIcon
              name="chevron.right"
              fallback="chevron-forward"
              size={16}
              color={colors.gray300}
            />
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
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.resultIconRect,
                  { backgroundColor: colors.gray200 },
                ]}
              >
                <SFIcon
                  name="doc.text.fill"
                  fallback="document-text"
                  size={20}
                  color={colors.gray400}
                />
              </View>
            )}
            <View style={styles.resultText}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {post.content}
              </Text>
              <View style={styles.postMeta}>
                {place && (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {place.name}
                  </Text>
                )}
              </View>
            </View>
            {post.likes > 0 && (
              <View style={styles.likeCount}>
                <SFIcon
                  name="heart.fill"
                  fallback="heart"
                  size={12}
                  color={colors.liked}
                />
                <Text style={styles.likeCountText}>
                  {formatNumber(post.likes)}
                </Text>
              </View>
            )}
          </HapticPressable>
        );
      }

      case "event": {
        const event = item.data as Event;
        const place = eventPlaces.get(event.placeId);
        if (!place) return null;
        return (
          <View style={{ paddingVertical: 6 }}>
            <EventCard
              event={event}
              place={place}
              onPress={() => handleEventPress(event.id)}
            />
          </View>
        );
      }

      case "guide": {
        const guide = item.data as Guide;
        return (
          <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <GuideCard
              guide={guide}
              compact
              onPress={() => handleGuidePress(guide.id)}
            />
          </View>
        );
      }

      default:
        return null;
    }
  };

  // ─── Error State ─────────────────────────────────────────────────────────

  if (placesError && !places) {
    return <QueryErrorState message={placesError} onRetry={refetchPlaces} />;
  }

  // ─── Search Mode ─────────────────────────────────────────────────────────

  if (query.trim()) {
    return (
      <Animated.View
        style={styles.container}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <Text style={styles.sectionHeaderCount}>
                {section.data.length}
              </Text>
            </View>
          )}
          renderSectionFooter={({ section }) => {
            if (section.title === "Places" && googleLoading) {
              return (
                <View style={styles.shimmerRow}>
                  <ShimmerBlock
                    width={44}
                    height={44}
                    borderRadius={10}
                    colors={colors}
                  />
                  <View style={styles.shimmerTextCol}>
                    <ShimmerBlock
                      width={160}
                      height={14}
                      borderRadius={4}
                      colors={colors}
                    />
                    <ShimmerBlock
                      width={100}
                      height={12}
                      borderRadius={4}
                      colors={colors}
                      style={{ marginTop: 6 }}
                    />
                  </View>
                </View>
              );
            }
            return null;
          }}
          contentContainerStyle={[
            styles.searchResults,
            { paddingTop: insets.top },
          ]}
          ListHeaderComponent={
            <View>
              {/* Filter Chip Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipBar}
              >
                {FILTER_CHIPS.map((chip) => {
                  const isActive = activeFilter === chip.key;
                  return (
                    <HapticPressable
                      key={chip.key}
                      style={[
                        styles.filterChip,
                        isActive
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.gray100 },
                      ]}
                      onPress={() => handleFilterChange(chip.key)}
                    >
                      <SFIcon
                        name={chip.icon}
                        fallback={chip.fallback}
                        size={14}
                        color={isActive ? "#FFFFFF" : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive
                            ? { color: "#FFFFFF" }
                            : { color: colors.text },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </HapticPressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SFIcon
                name="magnifyingglass"
                fallback="search"
                size={48}
                color={colors.gray300}
              />
              <Text style={styles.emptyTitle}>
                No results for &ldquo;{query}&rdquo;
              </Text>
              <Text style={styles.emptySubtext}>
                Try searching for places, people, or events
              </Text>
            </View>
          }
        />
      </Animated.View>
    );
  }

  // ─── Browse Mode ─────────────────────────────────────────────────────────

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Quick Categories ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <BrowseSectionHeader title="Browse" colors={colors} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {ALL_CATEGORIES.map((cat) => (
              <HapticPressable
                key={cat}
                style={[
                  styles.quickCategoryCard,
                  {
                    backgroundColor: colors.category[cat] + "10",
                    borderColor: colors.category[cat] + "30",
                  },
                ]}
                onPress={() => onQueryChange?.(CATEGORY_LABELS[cat])}
              >
                <SFIcon
                  name={CATEGORY_ICONS[cat].sf}
                  fallback={CATEGORY_ICONS[cat].fallback}
                  size={18}
                  color={colors.category[cat]}
                />
                <Text
                  style={[
                    styles.quickCategoryLabel,
                    { color: colors.category[cat] },
                  ]}
                >
                  {CATEGORY_LABELS[cat]}
                </Text>
              </HapticPressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Trending Hashtags ────────────────────────────────────────── */}
        {(trendingHashtags?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <BrowseSectionHeader title="Trending" colors={colors} />
            <View style={styles.chipGrid}>
              {(trendingHashtags ?? []).map((hashtag, index) => (
                <HapticPressable
                  key={hashtag.id}
                  style={styles.trendingChip}
                  onPress={() => handleHashtagPress(hashtag.name)}
                >
                  {index < 3 && (
                    <SFIcon
                      name="flame.fill"
                      fallback="flame"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                  <Text style={styles.trendingName}>#{hashtag.name}</Text>
                  <Text style={styles.trendingCount}>
                    {formatNumber(hashtag.postCount)}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Popular Places ───────────────────────────────────────────── */}
        {trendingPlaces.length > 0 && (
          <View style={styles.section}>
            <BrowseSectionHeader title="Popular Places" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {trendingPlaces.map((place) => (
                <HapticPressable
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => handlePlacePress(place.id)}
                >
                  <View
                    style={[
                      styles.placeCardAccent,
                      { backgroundColor: colors.category[place.category] },
                    ]}
                  />
                  <View style={styles.placeCardContent}>
                    <View style={styles.placeCardHeader}>
                      <View
                        style={[
                          styles.placeCardIcon,
                          {
                            backgroundColor:
                              colors.category[place.category] + "18",
                          },
                        ]}
                      >
                        <SFIcon
                          name={CATEGORY_ICONS[place.category].sf}
                          fallback={CATEGORY_ICONS[place.category].fallback}
                          size={14}
                          color={colors.category[place.category]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.placeCardCategory,
                          { color: colors.category[place.category] },
                        ]}
                      >
                        {CATEGORY_LABELS[place.category]}
                      </Text>
                    </View>
                    <Text style={styles.placeCardName} numberOfLines={2}>
                      {place.name}
                    </Text>
                    <Text style={styles.placeCardAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                    <View style={styles.placeCardFooter}>
                      <View style={styles.placeCardStat}>
                        <SFIcon
                          name="photo"
                          fallback="image-outline"
                          size={12}
                          color={colors.textMuted}
                        />
                        <Text style={styles.placeCardStatText}>
                          {place.postCount}{" "}
                          {place.postCount === 1 ? "post" : "posts"}
                        </Text>
                      </View>
                      {place.rating != null && (
                        <View style={styles.placeCardStat}>
                          <SFIcon
                            name="star.fill"
                            fallback="star"
                            size={12}
                            color={colors.primary}
                          />
                          <Text style={styles.placeCardStatText}>
                            {place.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </HapticPressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Upcoming Events ──────────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <BrowseSectionHeader title="Coming Up" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {upcomingEvents.map((event) => {
                const place = eventPlaces.get(event.placeId);
                if (!place) return null;
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    place={place}
                    variant="small"
                    onPress={() => handleEventPress(event.id)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Recent Guides ────────────────────────────────────────────── */}
        {(guides?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <BrowseSectionHeader title="Guides" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {(guides ?? []).slice(0, 6).map((guide) => (
                <View key={guide.id} style={styles.guideCardWrapper}>
                  <GuideCard
                    guide={guide}
                    compact
                    onPress={() => handleGuidePress(guide.id)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 100,
    },

    // ── Browse Sections ──────────────────────────────────────────────────

    section: {
      marginBottom: 28,
    },

    // Quick Categories
    categoryScrollContent: {
      paddingHorizontal: 16,
      gap: 10,
    },
    quickCategoryCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      gap: 8,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    quickCategoryLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },

    // Trending Hashtags
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
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    trendingName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    trendingCount: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },

    // Popular Places - Horizontal Cards
    horizontalScrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    placeCard: {
      width: 240,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    placeCardAccent: {
      width: 4,
    },
    placeCardContent: {
      flex: 1,
      padding: 12,
    },
    placeCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    placeCardIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    placeCardCategory: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    placeCardName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    placeCardAddress: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginBottom: 8,
    },
    placeCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    placeCardStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    placeCardStatText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },

    // Guide Cards
    guideCardWrapper: {
      width: 200,
    },

    // ── Filter Chips ─────────────────────────────────────────────────────

    filterChipBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    filterChipText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },

    // ── Search Section Headers ───────────────────────────────────────────

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
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionHeaderCount: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },

    // ── Search Results ───────────────────────────────────────────────────

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
      gap: 12,
    },
    resultIconRect: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray200,
    },
    postThumbnail: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.gray200,
    },
    resultText: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    resultSubtitle: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    resultTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    resultTrailing: {
      alignItems: "flex-end",
    },
    postMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    likeCount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    likeCountText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },

    // Category pill badge
    categoryPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    categoryPillText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.3,
    },

    // Shimmer loading row
    shimmerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    shimmerTextCol: {
      flex: 1,
    },

    // ── Empty State ──────────────────────────────────────────────────────

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
