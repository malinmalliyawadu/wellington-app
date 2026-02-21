import { Alert, View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SFIcon } from "../../../src/components/SFIcon";
import { signOut } from "../../../src/services/auth";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { ErrorScreen } from "../../../src/components/ErrorScreen";
import { useNotifications } from "../../../src/context/NotificationContext";
import { useSave } from "../../../src/context/SaveContext";
import { useAuth } from "../../../src/context/AuthContext";
import { colors } from "../../../src/theme/colors";

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <ErrorScreen error={error} retry={retry} />;
}

function GuidesButton() {
  const router = useRouter();
  const { profile } = useAuth();
  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() =>
        router.push({
          pathname: "/profile/guides" as any,
          params: { userId: profile?.id },
        })
      }
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="book"
        fallback="book-outline"
        size={22}
        color={colors.text}
      />
    </HapticPressable>
  );
}

function AchievementsButton() {
  const router = useRouter();
  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() => router.push("/profile/achievements" as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="trophy"
        fallback="trophy-outline"
        size={22}
        color={colors.text}
      />
    </HapticPressable>
  );
}

function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() => router.push("/profile/notifications" as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="bell"
        fallback="notifications"
        size={22}
        color={colors.text}
      />
      {unreadCount > 0 && <View style={bellStyles.dot} />}
    </HapticPressable>
  );
}

const bellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  dot: {
    position: "absolute",
    top: 0,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});

function SavedButton() {
  const router = useRouter();
  const { getSavedIds } = useSave();
  const totalSaved =
    getSavedIds("post").length +
    getSavedIds("place").length +
    getSavedIds("event").length;

  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() => router.push("/profile/saved" as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="bookmark"
        fallback="bookmark-outline"
        size={22}
        color={colors.text}
      />
      {totalSaved > 0 && <View style={bellStyles.dot} />}
    </HapticPressable>
  );
}

function PrivacyButton() {
  const router = useRouter();

  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() => router.push("/profile/privacy" as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="gearshape"
        fallback="settings-outline"
        size={22}
        color={colors.text}
      />
    </HapticPressable>
  );
}

function DiscoverButton() {
  const router = useRouter();
  return (
    <HapticPressable
      style={bellStyles.container}
      onPress={() => router.push("/profile/discover")}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="person.2"
        fallback="people-outline"
        size={22}
        color={colors.text}
      />
    </HapticPressable>
  );
}

function LogoutButton() {
  return (
    <HapticPressable
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
      }}
      onPress={() =>
        Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: () => signOut(),
          },
        ])
      }
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name="rectangle.portrait.and.arrow.right"
        fallback="log-out-outline"
        size={22}
        color={colors.text}
      />
    </HapticPressable>
  );
}

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Profile",
          headerTransparent: true,
          headerLeft: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <NotificationBell />
              <AchievementsButton />
              <GuidesButton />
              <SavedButton />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <PrivacyButton />
              <LogoutButton />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          headerShown: true,
          headerTitle: "Achievements",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: true,
          headerTitle: "Notifications",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="saved"
        options={{
          headerShown: true,
          headerTitle: "Saved",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="follow-list"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
          headerRight: () => <DiscoverButton />,
        }}
      />
      <Stack.Screen
        name="discover"
        options={{
          headerShown: true,
          headerTitle: "Discover People",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="place/[placeId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="likes"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: true,
          headerTitle: "Privacy",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="instagram-import"
        options={{
          headerShown: true,
          headerTitle: "Import from Instagram",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="create-post"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.95, 1.0],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="hashtag/[tag]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="guides"
        options={{
          headerShown: true,
          headerTitle: "Guides",
          headerBackTitle: "Profile",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="guide/[guideId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Guides",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="create-guide"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.95, 1.0],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
    </Stack>
  );
}
