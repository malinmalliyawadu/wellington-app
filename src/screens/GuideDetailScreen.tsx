import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  useLocalSearchParams,
  usePathname,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQueryClient } from "@tanstack/react-query";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { useSave } from "../context/SaveContext";
import { useLike } from "../context/LikeContext";
import { getGuideById, getGuidePlaces, deleteGuide } from "../services/guides";
import { getPlacesByIds } from "../services/places";
import { getTopPostMediaForPlaces } from "../services/posts";
import { getProfileById, getProfilesByIds } from "../services/users";
import {
  getGuideComments,
  createGuideComment,
  updateGuideComment,
  deleteGuideComment,
} from "../services/guideComments";
import { createGuideCommentNotification } from "../services/notifications";
import { shareGuide } from "../utils/sharing";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import { QueryErrorState } from "../components/QueryErrorState";
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

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

export function GuideDetailScreen() {
  const { colors } = useTheme();
  const { guideId } = useLocalSearchParams<{ guideId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { isSaved, toggleSave } = useSave();
  const { isGuideLiked, toggleGuideLike, getGuideLikeCount } = useLike();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const styles = createStyles(colors);
  const inputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const liked = isGuideLiked(guideId);
  const likeCount = getGuideLikeCount(guideId);

  const fetchGuide = useCallback(() => getGuideById(guideId), [guideId]);
  const {
    data: guide,
    loading: loadingGuide,
    error: guideError,
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

  // Comments
  const fetchComments = useCallback(
    () => getGuideComments(guideId),
    [guideId]
  );
  const { data: comments, refetch: refetchComments } = useQuery(
    fetchComments,
    ["guideComments", guideId],
    { staleTime: 30_000 }
  );

  const commentUserIds = useMemo(
    () => [...new Set((comments ?? []).map((c) => c.userId))],
    [comments]
  );
  const fetchCommentUsers = useCallback(
    () => getProfilesByIds(commentUserIds),
    [commentUserIds]
  );
  const { data: commentUsers } = useQuery(fetchCommentUsers, commentUserIds);
  const commentUserMap = useMemo(
    () => new Map((commentUsers ?? []).map((u) => [u.id, u])),
    [commentUsers]
  );

  useFocusEffect(
    useCallback(() => {
      refetchGuide();
      refetchPlaces();
      refetchComments();
    }, [refetchGuide, refetchPlaces, refetchComments])
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

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !profile) return;
    try {
      if (editingCommentId) {
        await updateGuideComment(editingCommentId, trimmed);
      } else {
        await createGuideComment({
          guideId,
          userId: profile.id,
          text: trimmed,
        });
        createGuideCommentNotification(profile.id, guideId).catch(() => {});
      }
      setEditingCommentId(null);
      setCommentText("");
      Keyboard.dismiss();
      queryClient.invalidateQueries({
        queryKey: ["q", ["guideComments", guideId]],
      });
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to save comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText("");
    Keyboard.dismiss();
  };

  const handlePressUser = (userId: string) => {
    router.push(`${tabBase}/user/${userId}` as any);
  };

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

  if (guideError && !guide) {
    return <QueryErrorState message={guideError} onRetry={refetchGuide} />;
  }

  if (!guide) return null;

  const allComments = comments ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={listData}
        keyExtractor={(item) => item.placeId}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 60,
        }}
        ListHeaderComponent={
          <>
            {heroImageUrl ? (
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
            ) : (
              <View style={{ height: headerHeight }} />
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
                  onPress={() => toggleGuideLike(guideId)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SFIcon
                    name={liked ? "heart.fill" : "heart"}
                    fallback={liked ? "heart" : "heart-outline"}
                    size={16}
                    color={liked ? colors.liked : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statText,
                      liked && { color: colors.liked },
                    ]}
                  >
                    {likeCount}
                  </Text>
                </HapticPressable>
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
                  onPress={() => shareGuide(guide.id)}
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
        ListFooterComponent={
          allComments.length > 0 ? (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsSectionTitle}>Comments</Text>
              {allComments.map((comment) => {
                const commentUser = commentUserMap.get(comment.userId);
                const isOwn = comment.userId === profile?.id;
                return (
                  <View key={comment.id} style={styles.commentRow}>
                    <HapticPressable
                      onPress={() => handlePressUser(comment.userId)}
                    >
                      <Image
                        source={{ uri: commentUser?.avatarUrl }}
                        style={styles.commentAvatar}
                        contentFit="cover"
                        transition={200}
                      />
                    </HapticPressable>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentText}>
                        <Text style={styles.commentAuthor}>
                          {commentUser?.displayName ?? "Unknown"}
                        </Text>
                        <Text style={styles.commentTime}>
                          {" "}
                          {formatTimeAgo(comment.createdAt)}
                        </Text>
                      </Text>
                      <Text style={styles.commentBody}>{comment.text}</Text>
                      {isOwn && (
                        <View style={styles.commentActions}>
                          <HapticPressable
                            onPress={() => {
                              setEditingCommentId(comment.id);
                              setCommentText(comment.text);
                              inputRef.current?.focus();
                            }}
                          >
                            <Text style={styles.commentActionText}>Edit</Text>
                          </HapticPressable>
                          <HapticPressable
                            onPress={() => {
                              Alert.alert(
                                "Delete comment?",
                                "This cannot be undone.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                      try {
                                        await deleteGuideComment(comment.id);
                                        queryClient.invalidateQueries({
                                          queryKey: [
                                            "q",
                                            ["guideComments", guideId],
                                          ],
                                        });
                                      } catch {}
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.commentActionText,
                                { color: colors.liked },
                              ]}
                            >
                              Delete
                            </Text>
                          </HapticPressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No places in this guide yet</Text>
          </View>
        }
      />

      {/* Comment input bar */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: inputFocused ? 8 : insets.bottom + 60 },
        ]}
      >
        {editingCommentId && (
          <HapticPressable
            onPress={handleCancelEdit}
            style={styles.cancelButton}
          >
            <SFIcon
              name="xmark.circle.fill"
              fallback="close-circle"
              size={22}
              color={colors.textMuted}
            />
          </HapticPressable>
        )}
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder={
            editingCommentId ? "Edit comment..." : "Add a comment..."
          }
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSubmitEditing={handleSubmitComment}
          returnKeyType="send"
        />
        <HapticPressable
          onPress={handleSubmitComment}
          disabled={!commentText.trim()}
          style={styles.sendButton}
        >
          <SFIcon
            name={
              editingCommentId ? "checkmark.circle.fill" : "paperplane.fill"
            }
            fallback={editingCommentId ? "checkmark-circle" : "send"}
            size={22}
            color={commentText.trim() ? colors.primary : colors.gray300}
          />
        </HapticPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroContainer: {
      height: 260,
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
    // Comments
    commentsSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.gray200,
      paddingTop: 16,
    },
    commentsSectionTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    commentRow: {
      flexDirection: "row",
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    commentAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.gray200,
      marginRight: 10,
    },
    commentContent: {
      flex: 1,
    },
    commentText: {
      fontSize: 13,
      lineHeight: 18,
    },
    commentAuthor: {
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    commentTime: {
      fontSize: 12,
      color: colors.textMuted,
    },
    commentBody: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 19,
      marginTop: 2,
    },
    commentActions: {
      flexDirection: "row",
      gap: 16,
      marginTop: 4,
    },
    commentActionText: {
      fontSize: 12,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    // Comment input bar
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.gray200,
      backgroundColor: colors.background,
    },
    commentInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gray100,
      paddingHorizontal: 16,
      fontSize: 14,
      color: colors.text,
    },
    cancelButton: {
      marginRight: 8,
      padding: 4,
    },
    sendButton: {
      marginLeft: 8,
      padding: 4,
    },
  });
