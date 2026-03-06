import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, useNavigation } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { uploadAvatar } from "../services/storage";
import { compressAvatar } from "../utils/compressMedia";
import { HapticPressable } from "../components/HapticPressable";
import { fonts } from "../theme/fonts";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { useTheme, type Colors } from "../theme/ThemeContext";

export function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { profile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [instagram, setInstagram] = useState(profile?.instagramUsername ?? "");
  const [tiktok, setTiktok] = useState(profile?.tiktokUsername ?? "");
  const [xHandle, setXHandle] = useState(profile?.xUsername ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const hasChanges =
    displayName !== (profile?.displayName ?? "") ||
    username !== (profile?.username ?? "") ||
    bio !== (profile?.bio ?? "") ||
    avatarUrl !== (profile?.avatarUrl ?? "") ||
    instagram !== (profile?.instagramUsername ?? "") ||
    tiktok !== (profile?.tiktokUsername ?? "") ||
    xHandle !== (profile?.xUsername ?? "");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    navigation,
    hasChanges,
    saving,
    displayName,
    username,
    bio,
    avatarUrl,
    instagram,
    tiktok,
    xHandle,
  ]);

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
        instagramUsername: instagram.trim() || undefined,
        tiktokUsername: tiktok.trim() || undefined,
        xUsername: xHandle.trim() || undefined,
      });

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: headerHeight }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
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

          <Text style={styles.sectionTitle}>Social Links</Text>

          <View style={styles.field}>
            <View style={styles.socialInputRow}>
              <Ionicons
                name="logo-instagram"
                size={20}
                color={colors.textSecondary}
                style={styles.socialIcon}
              />
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={instagram}
                  onChangeText={(text) => setInstagram(text.replace(/^@/, ""))}
                  placeholder="instagram handle"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.socialInputRow}>
              <Ionicons
                name="logo-tiktok"
                size={20}
                color={colors.textSecondary}
                style={styles.socialIcon}
              />
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={tiktok}
                  onChangeText={(text) => setTiktok(text.replace(/^@/, ""))}
                  placeholder="tiktok handle"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={24}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.socialInputRow}>
              <Ionicons
                name="logo-twitter"
                size={20}
                color={colors.textSecondary}
                style={styles.socialIcon}
              />
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={xHandle}
                  onChangeText={(text) => setXHandle(text.replace(/^@/, ""))}
                  placeholder="X handle"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={15}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      backgroundColor: "transparent",
      fontSize: 16,
      color: colors.textMuted,
      paddingLeft: 12,
      fontWeight: "500",
    },
    usernameInput: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingLeft: 2,
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
    sectionTitle: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 16,
    },
    socialInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    socialIcon: {
      width: 24,
      textAlign: "center",
    },
  });
