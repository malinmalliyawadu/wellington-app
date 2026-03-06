import React from "react";
import { View, Text, Alert } from "react-native";
import { Image } from "expo-image";
import type { QueryClient } from "@tanstack/react-query";
import type { Router } from "expo-router";
import { HapticPressable } from "../../components/HapticPressable";
import { HashtagText } from "../../components/HashtagText";
import { deleteComment } from "../../services/comments";
import { formatTimeAgo } from "./formatTimeAgo";
import type { Colors } from "../../theme/ThemeContext";
import type { User } from "../../types/User";
import type { createStyles } from "./postDetailStyles";

type Comment = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
};

type Props = {
  comments: Comment[];
  commentUserMap: Map<string, User>;
  profileId: string | undefined;
  currentTab: string;
  router: Router;
  queryClient: QueryClient;
  postId: string;
  onPressUser: (userId: string) => void;
  onPressMention: (username: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
};

export function CommentSection({
  comments,
  commentUserMap,
  profileId,
  currentTab,
  router,
  queryClient,
  postId,
  onPressUser,
  onPressMention,
  onEditComment,
  colors,
  styles,
}: Props) {
  if (comments.length === 0) return null;

  return (
    <View style={styles.commentsSection}>
      {comments.map((comment) => {
        const commentUser = commentUserMap.get(comment.userId);
        const isOwn = comment.userId === profileId;
        return (
          <View key={comment.id} style={styles.commentRow}>
            <HapticPressable
              onPress={() => onPressUser(comment.userId)}
            >
              <Image
                source={{ uri: commentUser?.avatarUrl }}
                style={styles.commentAvatar}
                contentFit="cover"
                transition={200}
              />
            </HapticPressable>
            <View style={styles.commentContent}>
              <Text style={styles.commentText}>
                <Text style={styles.commentAuthor}>
                  {commentUser?.displayName ?? "Unknown"}
                </Text>
                <Text style={styles.commentTime}>
                  {" "}
                  {formatTimeAgo(comment.createdAt)}
                </Text>
              </Text>
              <HashtagText
                style={styles.commentBody}
                onPressHashtag={(tag) =>
                  router.push(`${currentTab}/hashtag/${tag}` as any)
                }
                onPressMention={onPressMention}
              >
                {comment.text}
              </HashtagText>
              {isOwn && (
                <View style={styles.commentActions}>
                  <HapticPressable
                    onPress={() => onEditComment(comment.id, comment.text)}
                  >
                    <Text style={styles.commentActionText}>Edit</Text>
                  </HapticPressable>
                  <HapticPressable
                    onPress={() => {
                      Alert.alert(
                        "Delete comment?",
                        "This cannot be undone.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await deleteComment(comment.id);
                                queryClient.invalidateQueries({
                                  queryKey: ["q", ["comments", postId]],
                                });
                              } catch {}
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.commentActionText,
                        { color: colors.liked },
                      ]}
                    >
                      Delete
                    </Text>
                  </HapticPressable>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
