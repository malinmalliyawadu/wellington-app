import { Alert, View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SFIcon } from "../../../src/components/SFIcon";
import { signOut } from "../../../src/services/auth";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { useNotifications } from "../../../src/context/NotificationContext";
import { colors } from "../../../src/theme/colors";

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
          headerLeft: () => <NotificationBell />,
          headerRight: () => <LogoutButton />,
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
    </Stack>
  );
}
