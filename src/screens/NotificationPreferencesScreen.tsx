import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../services/notificationPreferences";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

export function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getNotificationPreferences(userId)
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggle = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      if (!userId || !prefs) return;
      const updated = { ...prefs, [key]: value };
      setPrefs(updated);
      updateNotificationPreferences(userId, { [key]: value }).catch(() => {
        // Revert on failure
        setPrefs(prefs);
      });
    },
    [userId, prefs]
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight + 40 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!prefs) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: headerHeight + 16,
        paddingBottom: insets.bottom + 40,
      }}
    >
      {/* Push Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <ToggleRow
          label="Push Notifications"
          description="Receive push notifications on your device"
          value={prefs.pushEnabled}
          onToggle={(v) => handleToggle("pushEnabled", v)}
          colors={colors}
        />
      </View>

      {/* Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <ToggleRow
          label="Likes"
          description="When someone likes your post"
          value={prefs.likes}
          onToggle={(v) => handleToggle("likes", v)}
          colors={colors}
        />
        <ToggleRow
          label="Comments"
          description="When someone comments on your post"
          value={prefs.comments}
          onToggle={(v) => handleToggle("comments", v)}
          colors={colors}
        />
        <ToggleRow
          label="Follows"
          description="When someone follows you"
          value={prefs.follows}
          onToggle={(v) => handleToggle("follows", v)}
          colors={colors}
        />
        <ToggleRow
          label="Replies"
          description="When someone replies to your comment"
          value={prefs.commentReplies}
          onToggle={(v) => handleToggle("commentReplies", v)}
          colors={colors}
        />
        <ToggleRow
          label="Mentions"
          description="When someone mentions you in a post or comment"
          value={prefs.mentions}
          onToggle={(v) => handleToggle("mentions", v)}
          colors={colors}
        />
      </View>

      {/* Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events</Text>
        <ToggleRow
          label="Attendance"
          description="When someone attends your event"
          value={prefs.eventAttendance}
          onToggle={(v) => handleToggle("eventAttendance", v)}
          colors={colors}
        />
        <ToggleRow
          label="Reminders"
          description="Reminders before events you're attending"
          value={prefs.eventReminders}
          onToggle={(v) => handleToggle("eventReminders", v)}
          colors={colors}
        />
      </View>

      {/* Guides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guides</Text>
        <ToggleRow
          label="Guide Likes"
          description="When someone likes your guide"
          value={prefs.guideLikes}
          onToggle={(v) => handleToggle("guideLikes", v)}
          colors={colors}
        />
        <ToggleRow
          label="Guide Comments"
          description="When someone comments on your guide"
          value={prefs.guideComments}
          onToggle={(v) => handleToggle("guideComments", v)}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
  colors,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: Colors;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray300, true: colors.primary }}
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.gray200,
    },
    rowText: {
      flex: 1,
      marginRight: 12,
    },
    rowLabel: {
      fontSize: 16,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    rowDescription: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
