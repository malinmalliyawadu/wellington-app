import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  useLocalSearchParams,
  usePathname,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { SFIcon } from "../components/SFIcon";
import { GuideCard } from "../components/GuideCard";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { getGuidesByUserId } from "../services/guides";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

export function GuidesListScreen() {
  const { colors } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { profile } = useAuth();
  const styles = createStyles(colors);

  const isOwnProfile = profile?.id === userId;

  const fetchGuides = useCallback(
    () => getGuidesByUserId(userId),
    [userId]
  );
  const { data: guides, loading, refetch } = useQuery(fetchGuides, [
    "guides",
    "user",
    userId,
  ]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  return (
    <View style={styles.container}>
      <FlatList
        data={guides ?? []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight + 8,
          paddingBottom: insets.bottom + 60,
          paddingHorizontal: 16,
        }}
        ListHeaderComponent={
          isOwnProfile ? (
            <LiquidGlassButton
              title="Create Guide"
              variant="primary"
              size="medium"
              icon="add"
              fullWidth
              onPress={() =>
                router.push(`${tabBase}/create-guide` as any)
              }
              style={styles.createButton}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <GuideCard
              guide={item}
              onPress={() =>
                router.push(`${tabBase}/guide/${item.id}`)
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SFIcon
              name="book"
              fallback="book-outline"
              size={40}
              color={colors.gray300}
            />
            <Text style={styles.emptyText}>
              {isOwnProfile
                ? "You haven't created any guides yet"
                : "No guides yet"}
            </Text>
            {isOwnProfile && (
              <Text style={styles.emptySubtext}>
                Create a guide to share your favourite spots
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  createButton: {
    marginBottom: 16,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
