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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Animated, {
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
import { useTheme } from "../theme/ThemeContext";
import type {
  Place,
  AIResponse,
  ChatMessage,
} from "../types";

import { WellyHero } from "./ai-chat/WellyHero";
import { EventChatHero } from "./ai-chat/EventChatHero";
import {
  PlaceRecommendationCard,
  EventRecommendationCard,
  GuideRecommendationCard,
} from "./ai-chat/RecommendationCards";
import {
  getSuggestionChips,
  trimIncompleteMarkdown,
  CHAT_STORAGE_KEY,
} from "./ai-chat/chatHelpers";
import { createStyles, createMarkdownStyles } from "./ai-chat/chatStyles";

let msgId = 0;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      keyboardVerticalOffset={0}
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
                  <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
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
                  <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
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
          { paddingBottom: keyboardVisible ? 4 : insets.bottom + 49 + 8 },
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
            size={40}
            color={
              inputText.trim() && !isBusy ? colors.primary : colors.gray300
            }
          />
        </HapticPressable>
      </View>
    </KeyboardAvoidingView>
  );
}
