import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { deleteAccount } from "../services/auth";
import { useInstagramConnection } from "../hooks/useInstagramConnection";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { SFIcon } from "../components/SFIcon";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import type { ProfileVisibility } from "../types/User";

export function SettingsScreen() {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { profile, updateProfile } = useAuth();
  const styles = createStyles(colors);

  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPrivate = profile?.profileVisibility === "private";

  const {
    connection: igConnection,
    isConnected: igConnected,
    isExpired: igExpired,
    connecting: igConnecting,
    connect: igConnect,
    disconnect: igDisconnect,
  } = useInstagramConnection();

  const handleToggleVisibility = async (value: boolean) => {
    const newVisibility: ProfileVisibility = value ? "private" : "public";
    setSavingPrivacy(true);
    try {
      await updateProfile({ profileVisibility: newVisibility });
    } catch {
      Alert.alert("Error", "Failed to update privacy settings. Please try again.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleInstagramConnect = async () => {
    try {
      await igConnect();
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) return;
      Alert.alert(
        "Connection Failed",
        "Failed to connect Instagram. Make sure you have a Professional (Business or Creator) account."
      );
    }
  };

  const handleInstagramDisconnect = () => {
    Alert.alert(
      "Disconnect Instagram",
      "You won't be able to import posts until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await igDisconnect();
            } catch {
              Alert.alert("Error", "Failed to disconnect Instagram.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!profile) return;

    Alert.alert(
      "Delete Account",
      "This will permanently delete your account, all your posts, and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you sure?",
              "This cannot be undone. All your data will be permanently deleted.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete My Account",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount(profile.id);
                    } catch (e) {
                      console.error("Account deletion error:", e);
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again."
                      );
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <SFIcon
                  name={isPrivate ? "lock" : "lock.open"}
                  fallback={isPrivate ? "lock-closed-outline" : "lock-open-outline"}
                  size={20}
                  color={colors.text}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>Private Profile</Text>
                <Text style={styles.description}>
                  {isPrivate
                    ? "Only your followers can see your posts and profile"
                    : "Anyone can see your posts and profile"}
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={handleToggleVisibility}
                disabled={savingPrivacy}
                trackColor={{ false: colors.gray200, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <Text style={styles.hint}>
            When your profile is private, only people who follow you can see your posts, places, and activity on the map.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="logo-instagram" size={24} color="#E1306C" />
              <View style={styles.connectedInfo}>
                <Text style={styles.label}>Instagram</Text>
                {igConnected && igConnection ? (
                  <Text style={styles.connectedUsername}>
                    @{igConnection.instagramUsername}
                  </Text>
                ) : igExpired ? (
                  <Text style={styles.connectedExpired}>
                    Session expired
                  </Text>
                ) : (
                  <Text style={styles.description}>
                    Import posts from Instagram
                  </Text>
                )}
              </View>
              {igConnected ? (
                <HapticPressable onPress={handleInstagramDisconnect}>
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </HapticPressable>
              ) : (
                <LiquidGlassButton
                  title={igExpired ? "Reconnect" : "Connect"}
                  onPress={handleInstagramConnect}
                  loading={igConnecting}
                  size="small"
                  variant="primary"
                />
              )}
            </View>
            {!igConnected && !igExpired && (
              <Text style={styles.igNote}>
                Requires a Professional (Business or Creator) account.
                Switching is free in Instagram settings.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This
            action cannot be undone.
          </Text>
          <HapticPressable
            onPress={handleDeleteAccount}
            disabled={deleting}
            style={styles.deleteButton}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </HapticPressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  connectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  connectedUsername: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  connectedExpired: {
    fontSize: 13,
    color: colors.error,
    marginTop: 1,
  },
  disconnectText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.error,
  },
  igNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 17,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  dangerSection: {
    margin: 16,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.error,
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center" as const,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
  },
});
