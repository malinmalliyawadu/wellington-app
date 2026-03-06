import React, { useMemo, useState, useEffect, useCallback } from "react";
import { LayoutAnimation, UIManager, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useQuery } from "../hooks/useQuery";
import { getPlaces, findOrCreatePlace } from "../services/places";
import { getPosts } from "../services/posts";
import { getProfiles } from "../services/users";
import { getUpcomingEvents } from "../services/events";
import { getGuides } from "../services/guides";
import { searchGooglePlaces } from "../services/googlePlaces";
import { getTrendingHashtags, searchHashtags } from "../services/hashtags";
import { QueryErrorState } from "../components/QueryErrorState";
import { SearchBrowseView } from "./search/SearchBrowseView";
import { SearchResultsView } from "./search/SearchResultsView";
import {
  CATEGORY_LABELS,
  FILTER_TO_SECTION,
  type FilterType,
  type SearchResult,
} from "./search/constants";
import type { Place, Hashtag } from "../types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchScreenProps {
  query?: string;
  onQueryChange?: (query: string) => void;
}

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

  // ─── Google Places Search ──────────────────────────────────────────────

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

  // ─── Navigation Handlers ───────────────────────────────────────────────

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

  // ─── Computed Data ─────────────────────────────────────────────────────

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

  // ─── Search Results ────────────────────────────────────────────────────

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

  // ─── Error State ───────────────────────────────────────────────────────

  if (placesError && !places) {
    return <QueryErrorState message={placesError} onRetry={refetchPlaces} />;
  }

  // ─── Search Mode ───────────────────────────────────────────────────────

  if (query.trim()) {
    return (
      <SearchResultsView
        query={query}
        colors={colors}
        insetTop={insets.top}
        filteredSections={filteredSections}
        activeFilter={activeFilter}
        googleLoading={googleLoading}
        places={places ?? null}
        eventPlaces={eventPlaces}
        creatingPlaceId={creatingPlaceId}
        onFilterChange={handleFilterChange}
        onPlacePress={handlePlacePress}
        onGooglePlacePress={handleGooglePlacePress}
        onUserPress={handleUserPress}
        onPostPress={handlePostPress}
        onEventPress={handleEventPress}
        onGuidePress={handleGuidePress}
        onHashtagPress={handleHashtagPress}
      />
    );
  }

  // ─── Browse Mode ───────────────────────────────────────────────────────

  return (
    <SearchBrowseView
      colors={colors}
      insetTop={insets.top}
      trendingPlaces={trendingPlaces}
      upcomingEvents={upcomingEvents}
      eventPlaces={eventPlaces}
      trendingHashtags={trendingHashtags ?? null}
      guides={guides ?? null}
      onQueryChange={onQueryChange}
      onPlacePress={handlePlacePress}
      onEventPress={handleEventPress}
      onGuidePress={handleGuidePress}
      onHashtagPress={handleHashtagPress}
    />
  );
}
