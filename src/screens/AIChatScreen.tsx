import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useNavigation, usePathname, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { askAIStreaming } from "../services/ai";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { AIThinkingAnimation } from "../components/AIThinkingAnimation";
import { getEventChips } from "../utils/eventChatChips";
import Markdown from "react-native-markdown-display";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import type {
  Place,
  AIResponse,
  AIPlaceRecommendation,
  AIEventRecommendation,
  AIGuideRecommendation,
  ChatMessage,
} from "../types";

const CATEGORY_ICONS: Record<string, { sf: any; fallback: any }> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "star.fill", fallback: "star" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
};

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning!", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon!", emoji: "🌤️" };
  return { text: "Good evening!", emoji: "🌙" };
}

function getSuggestionChips(): {
  label: string;
  emoji: string;
  description: string;
  question: string;
}[] {
  const hour = new Date().getHours();

  const chips: {
    label: string;
    emoji: string;
    description: string;
    question: string;
  }[] = [];

  chips.push({
    label: "Weekend plans",
    emoji: "📅",
    description: "Find things to do this weekend",
    question: "What should I do this weekend?",
  });

  if (hour < 11) {
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
    chips.push({
      label: "Breakfast",
      emoji: "🍳",
      description: "Start the day right",
      question: "What's a good breakfast spot?",
    });
  } else if (hour < 14) {
    chips.push({
      label: "Lunch",
      emoji: "🍽️",
      description: "Great spots for a midday meal",
      question: "Where's good for lunch?",
    });
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
  } else if (hour < 17) {
    chips.push({
      label: "Afternoon out",
      emoji: "🌿",
      description: "Ideas for the afternoon",
      question: "What's good for an afternoon outing?",
    });
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
  } else {
    chips.push({
      label: "Dinner",
      emoji: "🍽️",
      description: "Where to eat tonight",
      question: "Where's good for dinner tonight?",
    });
    chips.push({
      label: "Drinks",
      emoji: "🍻",
      description: "Bars and nightlife nearby",
      question: "What's a good bar for drinks tonight?",
    });
  }

  chips.push({
    label: "Events",
    emoji: "🎉",
    description: "What's happening in Welly",
    question: "What events are happening soon?",
  });
  chips.push({
    label: "Hidden gems",
    emoji: "💎",
    description: "Off the beaten track spots",
    question: "Show me some hidden gems in Wellington",
  });

  return chips.slice(0, 4);
}

/**
 * Clean incomplete markdown syntax from the end of streaming text.
 * Instead of stripping incomplete links (which hides lots of streamed text),
 * convert them to plain text so content stays visible while streaming.
 */
function trimIncompleteMarkdown(text: string): string {
  let result = text;

  // 1. Incomplete markdown links: convert partial `[text](url` to plain text
  //    Find the last `[` that isn't part of a complete `[text](url)` link
  const lastOpen = result.lastIndexOf("[");
  if (lastOpen !== -1) {
    const afterOpen = result.slice(lastOpen);
    if (!/^\[[^\]]*\]\([^)]*\)/.test(afterOpen)) {
      // Extract whatever link text exists and show it as plain text
      const linkTextMatch = afterOpen.match(/^\[([^\]]*)/);
      const plainText = linkTextMatch?.[1] ?? "";
      result = result.slice(0, lastOpen) + plainText;
    }
  }

  // 2. Incomplete bold: trailing ** without closing pair — strip the **
  const lastBold = result.lastIndexOf("**");
  if (lastBold !== -1) {
    const afterBold = result.slice(lastBold + 2);
    if (!afterBold.includes("**")) {
      result = result.slice(0, lastBold) + afterBold;
    }
  }

  // 3. Incomplete italic: trailing single * without closing pair — strip the *
  const lastStar = result.lastIndexOf("*");
  if (
    lastStar !== -1 &&
    result[lastStar - 1] !== "*" &&
    result[lastStar + 1] !== "*"
  ) {
    const afterStar = result.slice(lastStar + 1);
    if (!afterStar.includes("*")) {
      result = result.slice(0, lastStar) + afterStar;
    }
  }

  return result;
}

const CHAT_STORAGE_KEY = "ai_chat_history";
let msgId = 0;

function WellyHero({ colors, userName }: { colors: Colors; userName?: string }) {
  const glowOpacity = useSharedValue(0.15);
  const scale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.15, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1.0, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const greeting = useMemo(() => getGreeting(), []);

  return (
    <View style={heroStyles.container}>
      <View style={heroStyles.avatarWrapper}>
        <Animated.View
          style={[
            heroStyles.glow,
            { backgroundColor: colors.primary },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            heroStyles.avatar,
            { backgroundColor: colors.primary },
            avatarStyle,
          ]}
        >
          <SFIcon
            name="sparkles"
            fallback="sparkles"
            size={22}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
      <Text style={[heroStyles.brandName, { color: colors.text }]}>Welly</Text>
      <Text style={heroStyles.greeting}>
        {greeting.text}{userName ? ` ${userName}` : ""} {greeting.emoji}
      </Text>
      <Text style={[heroStyles.subtitle, { color: colors.textSecondary }]}>
        What are you keen to do in Wellington?
      </Text>
    </View>
  );
}

function EventChatHero({ colors, eventTitle, eventImageUrl }: { colors: Colors; eventTitle: string; eventImageUrl?: string }) {
  return (
    <View style={heroStyles.container}>
      {eventImageUrl ? (
        <Image
          source={{ uri: eventImageUrl }}
          style={heroStyles.eventImage}
        />
      ) : (
        <View style={[heroStyles.eventImagePlaceholder, { backgroundColor: colors.primary + "15" }]}>
          <SFIcon name="calendar" fallback="calendar" size={32} color={colors.primary} />
        </View>
      )}
      <Text style={[heroStyles.eventTitle, { color: colors.text }]} numberOfLines={2}>
        {eventTitle}
      </Text>
      <Text style={[heroStyles.subtitle, { color: colors.textSecondary }]}>
        Ask anything about this event
      </Text>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  glow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  brandName: {
    fontSize: 28,
    fontFamily: fonts.pacifico,
  },
  greeting: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: "#333",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  eventImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});


export function AIChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { location: userLocation } = useLocation();
  const { eventId, eventTitle, eventCategory, eventImageUrl } = useLocalSearchParams<{ eventId?: string; eventTitle?: string; eventCategory?: string; eventImageUrl?: string }>();
  const styles = createStyles(colors);
  const mdStyles = createMarkdownStyles(colors);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [statusText, setStatusText] = useState<string | undefined>(undefined);
  const [inputText, setInputText] = useState("");
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const lastResponseY = useRef(0);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isContentScrollable = useCallback(() => {
    return contentHeight.current > scrollViewHeight.current;
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (isContentScrollable()) {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [isContentScrollable]);

  const scrollToLastResponse = useCallback(() => {
    setTimeout(() => {
      if (isContentScrollable()) {
        scrollRef.current?.scrollTo({
          y: lastResponseY.current - 200,
          animated: true,
        });
      }
    }, 150);
  }, [isContentScrollable]);

  // Load persisted chat history on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed: ChatMessage[] = JSON.parse(stored);
          setMessages(parsed);
          // Restore msgId counter to avoid collisions
          const maxId = parsed.reduce(
            (max, m) => Math.max(max, parseInt(m.id, 10) || 0),
            0
          );
          msgId = maxId;
        }
      } catch (e) {
        console.error("[AIChatScreen] Failed to load chat history:", e);
      } finally {
        setIsHistoryLoaded(true);
      }
    })();
  }, []);

  // Persist messages whenever they change (after initial load)
  useEffect(() => {
    if (!isHistoryLoaded) return;
    AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)).catch(
      (e) => console.error("[AIChatScreen] Failed to save chat history:", e)
    );
  }, [messages, isHistoryLoaded]);

  // Scroll to bottom when history is loaded with existing messages
  useEffect(() => {
    if (isHistoryLoaded && messages.length > 0) {
      scrollToBottom();
    }
  }, [isHistoryLoaded]);

  // When opened with event context, clear chat history for a fresh conversation
  useEffect(() => {
    if (!isHistoryLoaded || !eventTitle) return;
    setMessages([]);
    AsyncStorage.removeItem(CHAT_STORAGE_KEY).catch(() => {});
  }, [isHistoryLoaded, eventTitle]);

  const navigation = useNavigation();
  const hasMessages = messages.length > 0;

  const handleNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setIsStreaming(false);
    setStreamingText("");
    setMessages([]);
  }, []);

  const isBusy = isLoading || isStreaming;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        hasMessages ? (
          <HapticPressable
            onPress={handleNewChat}
            disabled={isBusy}
            style={styles.headerButton}
          >
            <SFIcon
              name="plus.message"
              fallback="chatbubble"
              size={22}
              color={isBusy ? colors.gray300 : colors.text}
            />
          </HapticPressable>
        ) : null,
    });
  }, [navigation, hasMessages, isBusy, handleNewChat]);

  const suggestionChips = useMemo(() => getSuggestionChips(), []);

  const placeMap = useMemo(() => {
    const places: Place[] | undefined = queryClient.getQueryData([
      "q",
      "places",
    ]);
    const map = new Map<string, Place>();
    for (const p of places ?? []) map.set(p.id, p);
    return map;
  }, [queryClient]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleAsk = useCallback(
    async (question: string) => {
      // Abort any existing stream
      abortControllerRef.current?.abort();

      const userMsg: ChatMessage = {
        id: String(++msgId),
        role: "user",
        content: question,
      };

      const hadMessages = messages.length > 0;
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsStreaming(false);
      setStreamingText("");
      setStatusText("Connecting...");
      setInputText("");
      if (hadMessages) scrollToBottom();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Build full conversation history for Claude
        const allMessages = [...messages, userMsg];
        const conversationHistory = allMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content:
            m.role === "assistant" && m.aiResponse
              ? JSON.stringify(m.aiResponse)
              : m.content,
        }));

        await askAIStreaming(
          conversationHistory,
          {
            userName: profile?.displayName,
            userId: profile?.id ?? "",
            userLocation,
            eventContext: eventTitle ? { id: eventId, title: eventTitle } : undefined,
          },
          {
            onTextChunk: (text) => {
              // Transition from THINKING → STREAMING on first chunk
              setIsLoading(false);
              setIsStreaming(true);
              setStatusText(undefined);
              setStreamingText((prev) => prev + text);
              scrollToBottom();
            },
            onStatus: (text) => {
              setStatusText(text);
            },
            onComplete: (response: AIResponse) => {
              const assistantMsg: ChatMessage = {
                id: String(++msgId),
                role: "assistant",
                content: response.message,
                aiResponse: response,
              };
              setMessages((prev) => [...prev, assistantMsg]);
              setIsStreaming(false);
              setStreamingText("");
              setStatusText(undefined);
              abortControllerRef.current = null;
              scrollToLastResponse();
            },
            onError: (error: string) => {
              // Don't show error if we were aborted
              if (abortController.signal.aborted) return;
              const errorMsg: ChatMessage = {
                id: String(++msgId),
                role: "assistant",
                content: "",
                error,
              };
              setMessages((prev) => [...prev, errorMsg]);
              setIsLoading(false);
              setIsStreaming(false);
              setStreamingText("");
              setStatusText(undefined);
              abortControllerRef.current = null;
              scrollToLastResponse();
            },
          },
          abortController.signal
        );
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        const errorMsg: ChatMessage = {
          id: String(++msgId),
          role: "assistant",
          content: "",
          error: err.message ?? "Something went wrong",
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingText("");
        setStatusText(undefined);
        abortControllerRef.current = null;
        scrollToLastResponse();
      }
    },
    [
      profile?.id,
      profile?.displayName,
      userLocation,
      messages,
      scrollToBottom,
    ]
  );

  const handleChipPress = useCallback(
    (question: string) => {
      handleAsk(question);
    },
    [handleAsk]
  );

  const handleSend = useCallback(() => {
    const q = inputText.trim();
    if (!q || isBusy) return;
    handleAsk(q);
  }, [inputText, isBusy, handleAsk]);

  const pathname = usePathname();
  const tabPrefix = pathname.startsWith("/feed")
    ? "/feed"
    : pathname.startsWith("/events")
    ? "/events"
    : "/map";

  const handlePlacePress = useCallback(
    (placeId: string) => {
      router.push(`${tabPrefix}/place/${placeId}`);
    },
    [router, tabPrefix]
  );

  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push(`${tabPrefix}/event/${eventId}`);
    },
    [router, tabPrefix]
  );

  const handleGuidePress = useCallback(
    (guideId: string) => {
      router.push(`${tabPrefix}/guide/${guideId}`);
    },
    [router, tabPrefix]
  );

  const handleLinkPress = useCallback(
    (url: string) => {
      const placeMatch = url.match(/^place:(.+)$/);
      if (placeMatch) {
        router.push(`${tabPrefix}/place/${placeMatch[1]}`);
        return false;
      }
      const eventMatch = url.match(/^event:(.+)$/);
      if (eventMatch) {
        router.push(`${tabPrefix}/event/${eventMatch[1]}`);
        return false;
      }
      const userMatch = url.match(/^user:(.+)$/);
      if (userMatch) {
        router.push(`${tabPrefix}/user/${userMatch[1]}`);
        return false;
      }
      const guideMatch = url.match(/^guide:(.+)$/);
      if (guideMatch) {
        router.push(`${tabPrefix}/guide/${guideMatch[1]}`);
        return false;
      }
      return true;
    },
    [router, tabPrefix]
  );

  const handleRetry = useCallback(
    (failedMsgId: string) => {
      const idx = messages.findIndex((m) => m.id === failedMsgId);
      if (idx < 1) return;
      const userMsg = messages[idx - 1];
      if (userMsg.role !== "user") return;

      setMessages((prev) =>
        prev.filter((m) => m.id !== failedMsgId && m.id !== userMsg.id)
      );
      handleAsk(userMsg.content);
    },
    [messages, handleAsk]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          !hasMessages && styles.scrollContentIdle,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEnabled={hasMessages}
        onContentSizeChange={(_w, h) => {
          contentHeight.current = h;
        }}
        onLayout={(e) => {
          scrollViewHeight.current = e.nativeEvent.layout.height;
        }}
      >
        {!hasMessages && !eventTitle && (
          <View style={styles.idleContainer}>
            <WellyHero colors={colors} userName={profile?.displayName} />
            <View style={styles.chipsContainer}>
              {suggestionChips.map((chip) => (
                <HapticPressable
                  key={chip.label}
                  style={styles.chip}
                  onPress={() => handleChipPress(chip.question)}
                >
                  <Text style={styles.chipLabel}>
                    {chip.emoji} {chip.label}
                  </Text>
                  <Text style={styles.chipDescription}>{chip.description}</Text>
                </HapticPressable>
              ))}
            </View>
          </View>
        )}

        {!hasMessages && eventTitle && (
          <View style={styles.idleContainer}>
            <EventChatHero colors={colors} eventTitle={eventTitle} eventImageUrl={eventImageUrl} />
            <View style={styles.chipsContainer}>
              {getEventChips(eventTitle!, eventCategory).map((chip) => (
                <HapticPressable
                  key={chip.label}
                  style={styles.chip}
                  onPress={() => handleChipPress(chip.question)}
                >
                  <Text style={styles.chipLabel}>
                    {chip.emoji} {chip.label}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <View key={msg.id} style={styles.questionBubble}>
                <Text style={styles.questionText}>{msg.content}</Text>
              </View>
            );
          }

          if (msg.error) {
            return (
              <View
                key={msg.id}
                style={styles.errorBox}
                onLayout={(e) => {
                  lastResponseY.current = e.nativeEvent.layout.y;
                }}
              >
                <SFIcon
                  name="exclamationmark.triangle.fill"
                  fallback="warning"
                  size={24}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{msg.error}</Text>
                <HapticPressable
                  style={styles.retryButton}
                  onPress={() => handleRetry(msg.id)}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </HapticPressable>
              </View>
            );
          }

          return (
            <View
              key={msg.id}
              style={styles.aiResponseSection}
              onLayout={(e) => {
                lastResponseY.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.aiAvatarRow}>
                <View style={styles.aiAvatar}>
                  <SFIcon
                    name="sparkles"
                    fallback="sparkles"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.aiLabel}>Welly</Text>
              </View>

              <Markdown style={mdStyles} onLinkPress={handleLinkPress}>
                {msg.content}
              </Markdown>

              {msg.aiResponse && msg.aiResponse.places.length > 0 && (
                <View style={styles.cardsSection}>
                  {msg.aiResponse.places.map((place) => (
                    <PlaceRecommendationCard
                      key={place.placeId}
                      recommendation={place}
                      placeData={placeMap.get(place.placeId)}
                      onPress={() => handlePlacePress(place.placeId)}
                    />
                  ))}
                </View>
              )}

              {msg.aiResponse && msg.aiResponse.events.length > 0 && (
                <View style={styles.cardsSection}>
                  {msg.aiResponse.events.map((event) => (
                    <EventRecommendationCard
                      key={event.eventId}
                      recommendation={event}
                      onPress={() => handleEventPress(event.eventId)}
                    />
                  ))}
                </View>
              )}

              {msg.aiResponse &&
                msg.aiResponse.guides &&
                msg.aiResponse.guides.length > 0 && (
                  <View style={styles.cardsSection}>
                    {msg.aiResponse.guides.map((guide) => (
                      <GuideRecommendationCard
                        key={guide.guideId}
                        recommendation={guide}
                        onPress={() => handleGuidePress(guide.guideId)}
                      />
                    ))}
                  </View>
                )}

              {msg.aiResponse?.followUp && !isBusy && (
                <View style={styles.followUpSection}>
                  <Text style={styles.followUpQuestion}>
                    {msg.aiResponse.followUp}
                  </Text>
                  {msg.aiResponse.followUpPrompts &&
                    msg.aiResponse.followUpPrompts.length > 0 && (
                      <View style={styles.followUpChips}>
                        {msg.aiResponse.followUpPrompts.map((fp) => (
                          <HapticPressable
                            key={fp.label}
                            style={styles.followUpChip}
                            onPress={() => handleAsk(fp.prompt)}
                          >
                            <Text style={styles.followUpChipText}>
                              {fp.label}
                            </Text>
                          </HapticPressable>
                        ))}
                      </View>
                    )}
                </View>
              )}
            </View>
          );
        })}

        {isLoading && (
          <Animated.View exiting={FadeOut.duration(200)}>
            <AIThinkingAnimation statusText={statusText} />
          </Animated.View>
        )}

        {isStreaming && streamingText.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.aiResponseSection}
          >
            <View style={styles.aiAvatarRow}>
              <View style={styles.aiAvatar}>
                <SFIcon
                  name="sparkles"
                  fallback="sparkles"
                  size={14}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.aiLabel}>Welly</Text>
            </View>
            <Markdown style={mdStyles} onLinkPress={handleLinkPress}>
              {trimIncompleteMarkdown(streamingText)}
            </Markdown>
            <AIThinkingAnimation showLabel={false} statusText={statusText} />
          </Animated.View>
        )}
      </ScrollView>

      <View
        style={[
          styles.inputBar,
          { paddingBottom: keyboardVisible ? 0 : insets.bottom + 49 + 8 },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={
            hasMessages
              ? "Reply..."
              : eventTitle
                ? `Ask about ${eventTitle}...`
                : "Ask me anything about Wellington..."
          }
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
          editable={!isBusy}
        />
        <HapticPressable
          style={[
            styles.sendButton,
            (!inputText.trim() || isBusy) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isBusy}
        >
          <SFIcon
            name="arrow.up.circle.fill"
            fallback="arrow-up-circle"
            size={32}
            color={
              inputText.trim() && !isBusy ? colors.primary : colors.gray300
            }
          />
        </HapticPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function PlaceRecommendationCard({
  recommendation,
  placeData,
  onPress,
}: {
  recommendation: AIPlaceRecommendation;
  placeData?: Place;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const icon =
    CATEGORY_ICONS[recommendation.category] ?? CATEGORY_ICONS.attraction;
  const categoryColor =
    (colors.category as Record<string, string>)[recommendation.category] ??
    colors.primary;

  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: categoryColor + "15" },
        ]}
      >
        <SFIcon
          name={icon.sf}
          fallback={icon.fallback}
          size={18}
          color={categoryColor}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.placeName}
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}

function EventRecommendationCard({
  recommendation,
  onPress,
}: {
  recommendation: AIEventRecommendation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const eventDate = new Date(recommendation.date);
  const dateLabel = eventDate.toLocaleDateString("en-NZ", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = recommendation.startTime
    ? ` · ${recommendation.startTime}`
    : "";

  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <SFIcon
          name="calendar"
          fallback="calendar"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.eventTitle}
        </Text>
        <Text style={styles.recCardDate}>
          {dateLabel}
          {timeLabel}
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}

function GuideRecommendationCard({
  recommendation,
  onPress,
}: {
  recommendation: AIGuideRecommendation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <SFIcon
          name="book.fill"
          fallback="book"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.guideTitle}
        </Text>
        <Text style={styles.recCardDate}>
          by {recommendation.creatorName} · {recommendation.placeCount} places
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}

const createMarkdownStyles = (colors: Colors) =>
  StyleSheet.create({
    body: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: 22,
    },
    strong: {
      fontFamily: fonts.bold,
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    link: {
      color: colors.primary,
    },
  });

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headerButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 16,
      gap: 16,
    },
    scrollContentIdle: {
      flexGrow: 1,
    },
    // Idle state
    idleContainer: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: 24,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginTop: 24,
    },
    chip: {
      backgroundColor: colors.primary + "12",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      width: "47%",
    },
    chipLabel: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    chipDescription: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 2,
    },
    // Message bubbles
    questionBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      maxWidth: "80%",
    },
    questionText: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: "#FFFFFF",
    },
    // AI response
    aiResponseSection: {
      gap: 12,
    },
    aiAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    aiAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    aiLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    aiMessage: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: 22,
    },
    cardsSection: {
      gap: 8,
      marginTop: 4,
    },
    followUpSection: {
      gap: 10,
      marginTop: 4,
    },
    followUpQuestion: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    followUpChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    followUpChip: {
      backgroundColor: colors.primary + "12",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    followUpChipText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Error state
    errorBox: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 24,
    },
    errorText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryButtonText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
    // Input bar
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      backgroundColor: colors.gray100,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 40,
    },
    sendButton: {
      padding: 2,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    // Recommendation cards
    recCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.gray100,
      borderRadius: 14,
      padding: 12,
      gap: 12,
    },
    recIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    recCardContent: {
      flex: 1,
      gap: 2,
    },
    recCardTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    recCardDate: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    recCardReason: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
