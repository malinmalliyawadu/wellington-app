import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSave } from "../context/SaveContext";
import { getPostsByIds } from "../services/posts";
import { getPlacesByIds } from "../services/places";
import { getEventsByIds } from "../services/events";
import { getPlaces } from "../services/places";
import { useQuery } from "../hooks/useQuery";
import { PostsGrid } from "../components/PostsGrid";
import { EventCard } from "../components/EventCard";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import type { Place, PlaceCategory } from "../types";

type Tab = "posts" | "places" | "events";

const CATEGORY_ICONS: Record<PlaceCategory, { sf: string; fallback: string }> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
};

export function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { getSavedIds } = useSave();
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const savedPostIds = getSavedIds("post");
  const savedPlaceIds = getSavedIds("place");
  const savedEventIds = getSavedIds("event");

  const fetchPosts = useCallback(
    () => getPostsByIds(savedPostIds),
    [savedPostIds]
  );
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts, [
    "saved-posts",
    ...savedPostIds,
  ]);

  const fetchPlaces = useCallback(
    () => getPlacesByIds(savedPlaceIds),
    [savedPlaceIds]
  );
  const { data: places, refetch: refetchPlaces } = useQuery(fetchPlaces, [
    "saved-places",
    ...savedPlaceIds,
  ]);

  const fetchEvents = useCallback(
    () => getEventsByIds(savedEventIds),
    [savedEventIds]
  );
  const { data: events, refetch: refetchEvents } = useQuery(fetchEvents, [
    "saved-events",
    ...savedEventIds,
  ]);

  const fetchAllPlaces = useCallback(() => getPlaces(), []);
  const { data: allPlaces } = useQuery(fetchAllPlaces, "all-places");

  const placeMap = useMemo(
    () => new Map((allPlaces ?? []).map((p) => [p.id, p])),
    [allPlaces]
  );

  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchPlaces();
      refetchEvents();
    }, [refetchPosts, refetchPlaces, refetchEvents])
  );

  const postsWithPlaces = useMemo(() => {
    if (!posts) return [];
    return posts.map((post) => ({
      ...post,
      place: placeMap.get(post.placeId),
    }));
  }, [posts, placeMap]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "posts", label: "Posts", count: savedPostIds.length },
    { key: "places", label: "Places", count: savedPlaceIds.length },
    { key: "events", label: "Events", count: savedEventIds.length },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <PostsGrid
            posts={postsWithPlaces}
            onPostPress={(postId) => router.push(`/profile/post/${postId}`)}
            emptyText="No saved posts yet"
          />
        );

      case "places":
        if (!places || places.length === 0) {
          return (
            <View style={styles.emptyState}>
              <SFIcon
                name="bookmark"
                fallback="bookmark-outline"
                size={40}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No saved places yet</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <HapticPressable
                style={styles.placeRow}
                onPress={() => router.push(`/profile/place/${item.id}`)}
              >
                <View
                  style={[
                    styles.placeCategoryDot,
                    { backgroundColor: colors.category[item.category] },
                  ]}
                >
                  <SFIcon
                    name={CATEGORY_ICONS[item.category].sf as any}
                    fallback={CATEGORY_ICONS[item.category].fallback as any}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
                <SFIcon
                  name="chevron.right"
                  fallback="chevron-forward"
                  size={16}
                  color={colors.gray400}
                />
              </HapticPressable>
            )}
          />
        );

      case "events":
        if (!events || events.length === 0) {
          return (
            <View style={styles.emptyState}>
              <SFIcon
                name="bookmark"
                fallback="bookmark-outline"
                size={40}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No saved events yet</Text>
            </View>
          );
        }
        return (
          <View style={styles.eventsList}>
            {events.map((event) => {
              const place = placeMap.get(event.placeId);
              if (!place) return null;
              return (
                <View key={event.id} style={styles.eventCardWrapper}>
                  <EventCard
                    event={event}
                    place={place}
                    onPress={() => router.push(`/events/${event.id}`)}
                    compact
                  />
                </View>
              );
            })}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 60,
        }}
        ListHeaderComponent={
          <>
            {/* Tab bar */}
            <View style={styles.tabBar}>
              {tabs.map((tab) => (
                <HapticPressable
                  key={tab.key}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabCount,
                      activeTab === tab.key && styles.tabCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        activeTab === tab.key && styles.tabCountTextActive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </HapticPressable>
              ))}
            </View>

            {/* Content */}
            {renderContent()}
          </>
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
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabCount: {
    backgroundColor: colors.gray200,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  tabCountTextActive: {
    color: "#FFFFFF",
  },
  // Places list
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: 12,
  },
  placeCategoryDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  placeAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Events list
  eventsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCardWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
