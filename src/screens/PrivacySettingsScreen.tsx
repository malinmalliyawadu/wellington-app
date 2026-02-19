import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "../context/AuthContext";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import { SFIcon } from "../components/SFIcon";
import type { ProfileVisibility } from "../types/User";

export function PrivacySettingsScreen() {
  const headerHeight = useHeaderHeight();
  const { profile, updateProfile } = useAuth();

  const [saving, setSaving] = useState(false);
  const isPrivate = profile?.profileVisibility === "private";

  const handleToggleVisibility = async (value: boolean) => {
    const newVisibility: ProfileVisibility = value ? "private" : "public";

    setSaving(true);
    try {
      await updateProfile({ profileVisibility: newVisibility });
    } catch {
      Alert.alert("Error", "Failed to update privacy settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Visibility</Text>

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
              disabled={saving}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={styles.hint}>
          When your profile is private, only people who follow you can see your posts, places, and activity on the map.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
