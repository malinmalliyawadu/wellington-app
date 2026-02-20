import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useFollow } from "../context/FollowContext";
import { getOtherProfiles } from "../services/users";
import { uploadAvatar } from "../services/storage";
import { compressAvatar } from "../utils/compressMedia";
import { useQuery } from "../hooks/useQuery";
import { FollowButton } from "../components/FollowButton";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { HapticPressable } from "../components/HapticPressable";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import type { User } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TOTAL_STEPS = 4;

// Welcome slide data
const WELCOME_SLIDES = [
  {
    icon: "map" as const,
    title: "Discover Wellington",
    subtitle:
      "Find the best cafes, bars, restaurants, and hidden gems — all on a map built by locals.",
  },
  {
    icon: "people" as const,
    title: "Follow people you trust",
    subtitle:
      "See recommendations from friends, food bloggers, and local creators — not algorithms.",
  },
  {
    icon: "star" as const,
    title: "Share your favourites",
    subtitle:
      "Post photos, reviews, and tips to help others discover the best of Wellington.",
  },
];

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [locationAlreadyGranted, setLocationAlreadyGranted] = useState(false);

  // Check if location permission is already granted
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationAlreadyGranted(status === "granted");
    });
  }, []);

  // Welcome slide state
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const welcomeListRef = useRef<FlatList>(null);
  const welcomeScrollX = useRef(new Animated.Value(0)).current;

  // Profile setup state
  const profileScrollRef = useRef<ScrollView>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Follow people state
  const fetchUsers = useCallback(
    () => getOtherProfiles(profile?.id ?? ""),
    [profile?.id]
  );
  const { data: otherUsers, loading: loadingUsers } = useQuery(
    fetchUsers,
    profile?.id
  );

  const handleNext = () => {
    const nextStep = step + 1;
    // Skip location step if permission already granted
    if (nextStep === 3 && locationAlreadyGranted) {
      handleFinish();
      return;
    }
    if (nextStep < TOTAL_STEPS) {
      setStep(nextStep);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await completeOnboarding();
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
      setFinishing(false);
    }
  };

  // Welcome handlers
  const handleWelcomeNext = () => {
    if (welcomeIndex < WELCOME_SLIDES.length - 1) {
      const nextIndex = welcomeIndex + 1;
      welcomeListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setWelcomeIndex(nextIndex);
    } else {
      handleNext();
    }
  };

  // Profile handlers
  const handleChangePhoto = async () => {
    if (!profile) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to change your profile photo."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setUploadingPhoto(true);
      const compressedUri = await compressAvatar(result.assets[0].uri);
      const newAvatarUrl = await uploadAvatar(compressedUri, profile.id);
      setAvatarUrl(newAvatarUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Upload Failed", `Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        "Error",
        "Username can only contain letters, numbers, and underscores"
      );
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatarUrl,
      });
      handleNext();
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Location handler
  const handleEnableLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      handleFinish();
    } else {
      Alert.alert(
        "Location Denied",
        "You can enable location later in Settings.",
        [{ text: "OK", onPress: handleFinish }]
      );
    }
  };

  const renderWelcomeSlide = ({
    item,
  }: {
    item: (typeof WELCOME_SLIDES)[number];
  }) => (
    <View style={[welcomeStyles.slide, { width: SCREEN_WIDTH }]}>
      <View style={welcomeStyles.iconCircle}>
        <Ionicons name={item.icon} size={48} color={colors.primary} />
      </View>
      <Text style={welcomeStyles.title}>{item.title}</Text>
      <Text style={welcomeStyles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Animated.FlatList
              ref={welcomeListRef}
              data={WELCOME_SLIDES}
              renderItem={renderWelcomeSlide}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: welcomeScrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setWelcomeIndex(index);
              }}
              keyExtractor={(_, i) => String(i)}
            />
            <View style={welcomeStyles.dots}>
              {WELCOME_SLIDES.map((_, i) => {
                const dotWidth = welcomeScrollX.interpolate({
                  inputRange: [
                    (i - 1) * SCREEN_WIDTH,
                    i * SCREEN_WIDTH,
                    (i + 1) * SCREEN_WIDTH,
                  ],
                  outputRange: [8, 24, 8],
                  extrapolate: "clamp",
                });
                const dotOpacity = welcomeScrollX.interpolate({
                  inputRange: [
                    (i - 1) * SCREEN_WIDTH,
                    i * SCREEN_WIDTH,
                    (i + 1) * SCREEN_WIDTH,
                  ],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: "clamp",
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      welcomeStyles.dot,
                      { width: dotWidth, opacity: dotOpacity },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        );

      case 1:
        return (
          <ScrollView
            ref={profileScrollRef}
            style={styles.stepContainer}
            contentContainerStyle={profileStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>Set up your profile</Text>
            <Text style={styles.stepSubtitle}>Let people know who you are</Text>

            <View style={profileStyles.avatarSection}>
              <View style={profileStyles.avatarContainer}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={profileStyles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      profileStyles.avatar,
                      profileStyles.avatarPlaceholder,
                    ]}
                  >
                    <Ionicons name="person" size={40} color={colors.gray400} />
                  </View>
                )}
                {uploadingPhoto && (
                  <View style={profileStyles.avatarOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
              </View>
              <LiquidGlassButton
                title="Choose Photo"
                icon="camera"
                onPress={handleChangePhoto}
                loading={uploadingPhoto}
                size="small"
                variant="secondary"
              />
            </View>

            <View style={profileStyles.form}>
              <View style={profileStyles.field}>
                <Text style={profileStyles.label}>Display Name</Text>
                <TextInput
                  style={profileStyles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your display name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              <View style={profileStyles.field}>
                <Text style={profileStyles.label}>Username</Text>
                <View style={profileStyles.inputContainer}>
                  <Text style={profileStyles.atSymbol}>@</Text>
                  <TextInput
                    style={[profileStyles.input, profileStyles.usernameInput]}
                    value={username}
                    onChangeText={(text) => setUsername(text.toLowerCase())}
                    placeholder="username"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                </View>
              </View>

              <View style={profileStyles.field}>
                <Text style={profileStyles.label}>Bio</Text>
                <TextInput
                  style={[profileStyles.input, profileStyles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people a bit about yourself"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={150}
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      profileScrollRef.current?.scrollToEnd({ animated: true });
                    }, 50);
                  }}
                />
                <Text style={profileStyles.helperText}>{bio.length}/150</Text>
              </View>
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={followStyles.header}>
              <Text style={styles.stepTitle}>Follow some people</Text>
              <Text style={styles.stepSubtitle}>
                Their recommendations will appear on your map and feed
              </Text>
            </View>
            {loadingUsers ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={followStyles.loader}
              />
            ) : (
              <FlatList
                data={otherUsers ?? []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={followStyles.list}
                renderItem={({ item }: { item: User }) => (
                  <View style={followStyles.userRow}>
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={followStyles.avatar}
                    />
                    <View style={followStyles.userInfo}>
                      <Text style={followStyles.displayName}>
                        {item.displayName}
                      </Text>
                      <Text style={followStyles.username}>
                        @{item.username}
                      </Text>
                      {item.bio ? (
                        <Text style={followStyles.bio} numberOfLines={1}>
                          {item.bio}
                        </Text>
                      ) : null}
                    </View>
                    <FollowButton userId={item.id} compact />
                  </View>
                )}
              />
            )}
          </View>
        );

      case 3:
        return (
          <View style={[styles.stepContainer, locationStyles.container]}>
            <View style={locationStyles.content}>
              <View style={locationStyles.iconCircle}>
                <Ionicons name="location" size={48} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>Enable location</Text>
              <Text style={styles.stepSubtitle}>
                See what&apos;s nearby and get personalised recommendations based on
                where you are in Wellington
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderBottomButton = () => {
    switch (step) {
      case 0:
        return (
          <LiquidGlassButton
            title={
              welcomeIndex < WELCOME_SLIDES.length - 1 ? "Next" : "Get started"
            }
            onPress={handleWelcomeNext}
            size="large"
            fullWidth
          />
        );
      case 1:
        return (
          <LiquidGlassButton
            title="Continue"
            onPress={handleSaveProfile}
            loading={savingProfile}
            size="large"
            fullWidth
          />
        );
      case 2:
        return (
          <LiquidGlassButton
            title="Continue"
            onPress={handleNext}
            size="large"
            fullWidth
          />
        );
      case 3:
        return (
          <View style={bottomStyles.locationButtons}>
            <LiquidGlassButton
              title="Enable Location"
              icon="location"
              onPress={handleEnableLocation}
              loading={finishing}
              size="large"
              fullWidth
            />
            <HapticPressable
              onPress={handleFinish}
              style={bottomStyles.skipButton}
            >
              <Text style={bottomStyles.skipText}>Skip for now</Text>
            </HapticPressable>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {renderStep()}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {renderBottomButton()}
      </View>
    </KeyboardAvoidingView>
  );
}

// Main layout styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

// Welcome step styles
const welcomeStyles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});

// Profile setup styles
const profileStyles = StyleSheet.create({
  content: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
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
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
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
  form: {
    paddingHorizontal: 24,
  },
  field: {
    marginBottom: 20,
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
    fontFamily: fonts.medium,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingLeft: 4,
  },
  bioInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "right",
  },
});

// Follow people styles
const followStyles = StyleSheet.create({
  header: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  displayName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
});

// Location step styles
const locationStyles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
});

// Bottom bar button styles
const bottomStyles = StyleSheet.create({
  locationButtons: {
    gap: 12,
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
});
