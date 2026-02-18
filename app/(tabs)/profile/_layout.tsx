import { Alert } from "react-native";
import { Stack } from "expo-router";
import { SFIcon } from "../../../src/components/SFIcon";
import { signOut } from "../../../src/services/auth";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { colors } from "../../../src/theme/colors";

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
      <SFIcon name="rectangle.portrait.and.arrow.right" fallback="log-out-outline" size={22} color={colors.text} />
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
