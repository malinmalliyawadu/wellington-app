import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchInstagramMedia,
  fetchCarouselChildren,
  downloadMediaToCache,
} from "../services/instagramMedia";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import type { InstagramMedia } from "../types/Instagram";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAP = 1.5;
const NUM_COLUMNS = 3;
const CELL_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export function InstagramImportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const [selectedPost, setSelectedPost] = useState<InstagramMedia | null>(null);
  const [importing, setImporting] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["instagram-media"],
    queryFn: ({ pageParam }) => fetchInstagramMedia(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.paging?.cursors?.after,
    staleTime: 5 * 60 * 1000,
  });

  const allMedia =
    data?.pages.flatMap((page) => page.data) ?? [];

  const handleImport = useCallback(async (post: InstagramMedia) => {
    setImporting(true);
    try {
      let mediaFiles: {
        uri: string;
        type: "photo" | "video";
      }[] = [];

      if (post.media_type === "CAROUSEL_ALBUM") {
        const children = await fetchCarouselChildren(post.id);
        const downloads = await Promise.all(
          children.map(async (child) => {
            const isVideo = child.media_type === "VIDEO";
            const uri = await downloadMediaToCache(
              child.media_url,
              child.id,
              isVideo
            );
            return { uri, type: (isVideo ? "video" : "photo") as "photo" | "video" };
          })
        );
        mediaFiles = downloads;
      } else {
        const isVideo = post.media_type === "VIDEO";
        const uri = await downloadMediaToCache(
          post.media_url,
          post.id,
          isVideo
        );
        mediaFiles = [{ uri, type: isVideo ? "video" : "photo" }];
      }

      // Set shared intent — same pattern as share extension
      (global as any).__sharedIntent = {
        text: post.caption ?? "",
        mediaFiles,
      };

      setSelectedPost(null);
      router.push("/profile/create-post");
    } catch (error) {
      console.error("Instagram import error:", error);
      Alert.alert("Import Failed", "Could not download media from Instagram.");
    } finally {
      setImporting(false);
    }
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: { item: InstagramMedia; index: number }) => {
      const isVideo = item.media_type === "VIDEO";
      const isCarousel = item.media_type === "CAROUSEL_ALBUM";
      const thumbnailUri = item.thumbnail_url ?? item.media_url;

      return (
        <HapticPressable
          onPress={() => setSelectedPost(item)}
          style={[
            styles.cell,
            { marginLeft: index % NUM_COLUMNS !== 0 ? GAP : 0 },
          ]}
        >
          <Image source={{ uri: thumbnailUri }} style={styles.cellImage} contentFit="cover" transition={200} />
          {isVideo && (
            <View style={styles.mediaIcon}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </View>
          )}
          {isCarousel && (
            <View style={styles.mediaIcon}>
              <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
            </View>
          )}
        </HapticPressable>
      );
    },
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your Instagram posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: headerHeight }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>
          Could not load Instagram posts. Your session may have expired.
        </Text>
        <LiquidGlassButton
          title="Go Back"
          onPress={() => router.back()}
          variant="secondary"
          size="medium"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <FlatList
        data={allMedia}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 80 }]}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No Instagram posts found</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color={colors.primary}
            />
          ) : null
        }
      />

      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !importing && setSelectedPost(null)}
      >
        {selectedPost && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <HapticPressable
                onPress={() => !importing && setSelectedPost(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </HapticPressable>
              <Text style={styles.modalTitle}>Preview</Text>
              <View style={{ width: 56 }} />
            </View>

            <Image
              source={{
                uri:
                  selectedPost.thumbnail_url ?? selectedPost.media_url,
              }}
              style={styles.previewImage}
              contentFit="contain"
              transition={200}
            />

            {selectedPost.caption ? (
              <Text style={styles.caption} numberOfLines={6}>
                {selectedPost.caption}
              </Text>
            ) : null}

            <Text style={styles.timestamp}>
              {new Date(selectedPost.timestamp).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>

            <View style={styles.modalActions}>
              <LiquidGlassButton
                title="Import as Post"
                icon="download-outline"
                onPress={() => handleImport(selectedPost)}
                loading={importing}
                variant="primary"
                size="large"
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.importHint}>
              Media will be downloaded and you&apos;ll pick a Wellington place to tag
            </Text>
          </View>
        )}
      </Modal>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    fontFamily: fonts.medium,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    fontFamily: fonts.medium,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    marginTop: 48,
  },
  grid: {
    paddingBottom: 24,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: GAP,
    position: "relative",
  },
  cellImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
  },
  mediaIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingVertical: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: colors.gray100,
  },
  caption: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    padding: 16,
    fontFamily: fonts.medium,
  },
  timestamp: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  importHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 32,
  },
});
