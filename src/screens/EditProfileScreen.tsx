import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { uploadAvatar } from "../services/storage";
import { compressAvatar } from "../utils/compressMedia";
import { useInstagramConnection } from "../hooks/useInstagramConnection";
import { HapticPressable } from "../components/HapticPressable";
import { fonts } from "../theme/fonts";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { colors } from "../theme/colors";

export function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { profile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const {
    connection: igConnection,
    isConnected: igConnected,
    isExpired: igExpired,
    connecting: igConnecting,
    connect: igConnect,
    disconnect: igDisconnect,
  } = useInstagramConnection();

  const hasChanges =
    displayName !== (profile?.displayName ?? "") ||
    username !== (profile?.username ?? "") ||
    bio !== (profile?.bio ?? "") ||
    avatarUrl !== (profile?.avatarUrl ?? "");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HapticPressable
          onPress={handleSave}
          disabled={!hasChanges || saving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.saveButtonContainer}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.saveButton,
                (!hasChanges || saving) && styles.saveButtonDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </HapticPressable>
      ),
    });
  }, [navigation, hasChanges, saving, displayName, username, bio, avatarUrl]);

  const handleChangePhoto = async () => {
    if (!profile) return;

    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to change your profile photo."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      console.log("Selected image:", result.assets[0].uri);
      setUploadingPhoto(true);

      const compressedUri = await compressAvatar(result.assets[0].uri);
      const newAvatarUrl = await uploadAvatar(compressedUri, profile.id);
      console.log("Upload successful, new URL:", newAvatarUrl);
      setAvatarUrl(newAvatarUrl);
    } catch (e) {
      console.error("Photo upload error:", e);
      Alert.alert(
        "Upload Failed",
        "Something went wrong while uploading your photo. Please try again."
      );
    } finally {
      setUploadingPhoto(false);
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

  const handleSave = async () => {
    if (!profile) return;

    // Basic validation
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    // Username validation (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        "Error",
        "Username can only contain letters, numbers, and underscores"
      );
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl,
      });

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            {uploadingPhoto && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </View>
          <LiquidGlassButton
            title="Change Photo"
            icon="camera"
            onPress={handleChangePhoto}
            loading={uploadingPhoto}
            size="small"
            variant="secondary"
            style={styles.changePhotoButton}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              maxLength={50}
            />
            <Text style={styles.helperText}>
              This is how your name appears on your profile
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.input, styles.usernameInput]}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
            <Text style={styles.helperText}>
              Letters, numbers, and underscores only
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people a bit about yourself"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>{bio.length}/150</Text>
          </View>

          <View style={styles.connectedSection}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <View style={styles.connectedCard}>
              <View style={styles.connectedRow}>
                <Ionicons name="logo-instagram" size={24} color="#E1306C" />
                <View style={styles.connectedInfo}>
                  <Text style={styles.connectedLabel}>Instagram</Text>
                  {igConnected && igConnection ? (
                    <Text style={styles.connectedUsername}>
                      @{igConnection.instagramUsername}
                    </Text>
                  ) : igExpired ? (
                    <Text style={styles.connectedExpired}>
                      Session expired
                    </Text>
                  ) : (
                    <Text style={styles.connectedHint}>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  saveButtonContainer: {
    paddingHorizontal: 10,
    textAlign: "center",
  },
  saveButton: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  saveButtonDisabled: {
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray200,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    marginTop: 8,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  atSymbol: {
    fontSize: 16,
    color: colors.textMuted,
    paddingLeft: 16,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingLeft: 4,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  connectedSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  connectedCard: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  connectedLabel: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  connectedUsername: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  connectedHint: {
    fontSize: 13,
    color: colors.textMuted,
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
});
