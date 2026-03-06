import React from "react";
import { View, Text, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SFIcon } from "../../components/SFIcon";
import { EventCard } from "../../components/EventCard";
import { GuideCard } from "../../components/GuideCard";
import { HapticPressable } from "../../components/HapticPressable";
import { formatNumber } from "../../utils/formatNumber";
import { BrowseSectionHeader } from "./BrowseSectionHeader";
import { ALL_CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS } from "./constants";
import { createStyles } from "./searchStyles";
import type { Colors } from "../../theme/ThemeContext";
import type { Place, Event, Guide, Hashtag } from "../../types";

interface TrendingPlace extends Place {
  postCount: number;
}

interface SearchBrowseViewProps {
  colors: Colors;
  insetTop: number;
  trendingPlaces: TrendingPlace[];
  upcomingEvents: Event[];
  eventPlaces: Map<string, Place>;
  trendingHashtags: Hashtag[] | null;
  guides: Guide[] | null;
  onQueryChange?: (query: string) => void;
  onPlacePress: (placeId: string) => void;
  onEventPress: (eventId: string) => void;
  onGuidePress: (guideId: string) => void;
  onHashtagPress: (tagName: string) => void;
}

export function SearchBrowseView({
  colors,
  insetTop,
  trendingPlaces,
  upcomingEvents,
  eventPlaces,
  trendingHashtags,
  guides,
  onQueryChange,
  onPlacePress,
  onEventPress,
  onGuidePress,
  onHashtagPress,
}: SearchBrowseViewProps) {
  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insetTop },
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
                  onPress={() => onHashtagPress(hashtag.name)}
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
                  onPress={() => onPlacePress(place.id)}
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
                    onPress={() => onEventPress(event.id)}
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
                    onPress={() => onGuidePress(guide.id)}
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
