import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { EventCard } from "../../components/EventCard";
import { GuideCard } from "../../components/GuideCard";
import { formatNumber } from "../../utils/formatNumber";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "./constants";
import { ShimmerBlock } from "./ShimmerBlock";
import { createStyles } from "./searchStyles";
import type { Colors } from "../../theme/ThemeContext";
import type { Place, Post, User, Event, Hashtag, Guide } from "../../types";
import type { SearchResult } from "./constants";

interface SearchResultItemProps {
  item: SearchResult;
  colors: Colors;
  places: Place[] | null;
  eventPlaces: Map<string, Place>;
  creatingPlaceId: string | null;
  onPlacePress: (placeId: string) => void;
  onGooglePlacePress: (placeData: Omit<Place, "id">) => void;
  onUserPress: (userId: string) => void;
  onPostPress: (postId: string) => void;
  onEventPress: (eventId: string) => void;
  onGuidePress: (guideId: string) => void;
  onHashtagPress: (tagName: string) => void;
}

export function SearchResultItem({
  item,
  colors,
  places,
  eventPlaces,
  creatingPlaceId,
  onPlacePress,
  onGooglePlacePress,
  onUserPress,
  onPostPress,
  onEventPress,
  onGuidePress,
  onHashtagPress,
}: SearchResultItemProps) {
  const styles = createStyles(colors);

  switch (item.type) {
    case "hashtag": {
      const hashtag = item.data as Hashtag;
      return (
        <HapticPressable
          style={styles.resultItem}
          onPress={() => onHashtagPress(hashtag.name)}
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
              ? onGooglePlacePress(place)
              : onPlacePress((place as Place).id)
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
          onPress={() => onUserPress(user.id)}
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
          onPress={() => onPostPress(post.id)}
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
            onPress={() => onEventPress(event.id)}
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
            onPress={() => onGuidePress(guide.id)}
          />
        </View>
      );
    }

    default:
      return null;
  }
}
