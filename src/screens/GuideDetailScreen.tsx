import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import {
  useLocalSearchParams,
  usePathname,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { useSave } from "../context/SaveContext";
import { getGuideById, getGuidePlaces, deleteGuide } from "../services/guides";
import { getPlacesByIds } from "../services/places";
import { getTopPostMediaForPlaces } from "../services/posts";
import { getProfileById } from "../services/users";
import { shareGuide } from "../utils/sharing";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import type { PlaceCategory } from "../types";

const CATEGORY_ICONS: Record<PlaceCategory, { sf: string; fallback: string }> =
  {
    cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
    restaurant: { sf: "fork.knife", fallback: "restaurant" },
    bar: { sf: "wineglass.fill", fallback: "wine" },
    attraction: { sf: "safari", fallback: "compass" },
    park: { sf: "leaf.fill", fallback: "leaf" },
    venue: { sf: "music.note.list", fallback: "musical-notes" },
    trail: { sf: "figure.hiking", fallback: "walk" },
  };

export function GuideDetailScreen() {
  const { guideId } = useLocalSearchParams<{ guideId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { isSaved, toggleSave } = useSave();

  const fetchGuide = useCallback(() => getGuideById(guideId), [guideId]);
  const {
    data: guide,
    loading: loadingGuide,
    refetch: refetchGuide,
  } = useQuery(fetchGuide, ["guide", guideId]);

  const fetchGuidePlaces = useCallback(
    () => getGuidePlaces(guideId),
    [guideId]
  );
  const {
    data: guidePlaces,
    loading: loadingPlaces,
    refetch: refetchPlaces,
  } = useQuery(fetchGuidePlaces, ["guide-places", guideId]);

  const placeIds = useMemo(
    () => (guidePlaces ?? []).map((gp) => gp.placeId),
    [guidePlaces]
  );
  const fetchPlaces = useCallback(() => getPlacesByIds(placeIds), [placeIds]);
  const { data: places } = useQuery(fetchPlaces, ["places", ...placeIds]);

  const fetchMedia = useCallback(
    () => getTopPostMediaForPlaces(placeIds),
    [placeIds]
  );
  const { data: placeMediaMap } = useQuery(fetchMedia, [
    "place-media",
    ...placeIds,
  ]);

  const fetchCreator = useCallback(
    () => (guide ? getProfileById(guide.userId) : Promise.resolve(null)),
    [guide?.userId]
  );
  const { data: creator } = useQuery(fetchCreator, [
    "user",
    guide?.userId ?? "",
  ]);

  useFocusEffect(
    useCallback(() => {
      refetchGuide();
      refetchPlaces();
    }, [refetchGuide, refetchPlaces])
  );

  const loading = loadingGuide || loadingPlaces;
  const isOwner = profile?.id === guide?.userId;

  const placeMap = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places]
  );

  const heroImageUrl = useMemo(() => {
    if (guide?.coverImageUrl) return guide.coverImageUrl;
    const firstPlaceId = guidePlaces?.[0]?.placeId;
    if (firstPlaceId && placeMediaMap) {
      const media = placeMediaMap.get(firstPlaceId);
      return media?.thumbnailUrl ?? media?.mediaUrl;
    }
    return undefined;
  }, [guide?.coverImageUrl, guidePlaces, placeMediaMap]);

  const listData = useMemo(
    () =>
      (guidePlaces ?? []).map((gp) => ({
        ...gp,
        place: placeMap.get(gp.placeId),
        imageUrl: placeMediaMap?.get(gp.placeId),
      })),
    [guidePlaces, placeMap, placeMediaMap]
  );

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Guide", "Are you sure you want to delete this guide?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGuide(guideId);
            router.back();
          } catch {
            Alert.alert("Error", "Failed to delete guide");
          }
        },
      },
    ]);
  }, [guideId, router]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!guide) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.placeId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 60,
        }}
        ListHeaderComponent={
          <>
            {heroImageUrl && (
              <View style={styles.heroContainer}>
                <Image
                  source={{ uri: heroImageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  start={{ x: 0, y: 0.4 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.heroGradient}
                />
              </View>
            )}
            <View style={styles.header}>
              <Text style={styles.title}>{guide.title}</Text>
              {guide.description && (
                <Text style={styles.description}>{guide.description}</Text>
              )}

              <HapticPressable
                style={styles.creatorRow}
                onPress={() => router.push(`${tabBase}/user/${guide.userId}`)}
              >
                {creator?.avatarUrl ? (
                  <Image
                    source={{ uri: creator.avatarUrl }}
                    style={styles.creatorAvatar}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={[styles.creatorAvatar, styles.creatorAvatarFallback]}
                  >
                    <SFIcon
                      name="person.fill"
                      fallback="person"
                      size={14}
                      color={colors.textMuted}
                    />
                  </View>
                )}
                <Text style={styles.creatorName}>
                  {creator?.displayName ?? ""}
                </Text>
              </HapticPressable>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <SFIcon
                    name="mappin.and.ellipse"
                    fallback="location"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statText}>
                    {guide.placeCount}{" "}
                    {guide.placeCount === 1 ? "place" : "places"}
                  </Text>
                </View>
                <HapticPressable
                  style={styles.stat}
                  onPress={() => toggleSave("guide", guide.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SFIcon
                    name={
                      isSaved("guide", guide.id) ? "bookmark.fill" : "bookmark"
                    }
                    fallback={
                      isSaved("guide", guide.id)
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={16}
                    color={
                      isSaved("guide", guide.id)
                        ? colors.saved
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.statText,
                      isSaved("guide", guide.id) && { color: colors.saved },
                    ]}
                  >
                    Save
                  </Text>
                </HapticPressable>
                <HapticPressable
                  style={styles.stat}
                  onPress={() => shareGuide(guide.id, guide.title)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SFIcon
                    name="square.and.arrow.up"
                    fallback="share-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statText}>Share</Text>
                </HapticPressable>
              </View>

              {isOwner && (
                <View style={styles.ownerActions}>
                  <LiquidGlassButton
                    title="Edit Guide"
                    variant="secondary"
                    size="medium"
                    icon="create-outline"
                    onPress={() =>
                      router.push({
                        pathname: `${tabBase}/create-guide` as any,
                        params: { guideId: guide.id },
                      })
                    }
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <LiquidGlassButton
                    title="Delete"
                    variant="secondary"
                    size="medium"
                    icon="trash-outline"
                    onPress={handleDelete}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const place = item.place;
          if (!place) return null;
          const mediaUrl =
            item.imageUrl?.thumbnailUrl ?? item.imageUrl?.mediaUrl;

          return (
            <HapticPressable
              style={styles.placeRow}
              onPress={() => router.push(`${tabBase}/place/${place.id}`)}
            >
              <View style={styles.placeNumber}>
                <Text style={styles.placeNumberText}>{index + 1}</Text>
              </View>
              {mediaUrl ? (
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.placeThumbnail}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={[
                    styles.placeCategoryDot,
                    { backgroundColor: colors.category[place.category] },
                  ]}
                >
                  <SFIcon
                    name={CATEGORY_ICONS[place.category].sf as any}
                    fallback={CATEGORY_ICONS[place.category].fallback as any}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              )}
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={styles.placeAddress} numberOfLines={1}>
                  {place.address}
                </Text>
                {item.note && (
                  <Text style={styles.placeNote} numberOfLines={2}>
                    {item.note}
                  </Text>
                )}
              </View>
              <SFIcon
                name="chevron.right"
                fallback="chevron-forward"
                size={16}
                color={colors.gray400}
              />
            </HapticPressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No places in this guide yet</Text>
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
  heroContainer: {
    height: 200,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
  },
  creatorAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  creatorName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ownerActions: {
    flexDirection: "row",
    marginTop: 16,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: 12,
  },
  placeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  placeNumberText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  placeThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  placeCategoryDot: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
  placeNote: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
