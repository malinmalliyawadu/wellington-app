export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          bio: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string;
          bio?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string;
          bio?: string | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          name: string;
          category: PlaceCategory;
          address: string;
          latitude: number;
          longitude: number;
          rating: number | null;
          user_ratings_total: number | null;
          rating_fetched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: PlaceCategory;
          address: string;
          latitude: number;
          longitude: number;
          rating?: number | null;
          user_ratings_total?: number | null;
          rating_fetched_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: PlaceCategory;
          address?: string;
          latitude?: number;
          longitude?: number;
          rating?: number | null;
          user_ratings_total?: number | null;
          rating_fetched_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          type: PostType;
          content: string;
          media_url: string | null;
          thumbnail_url: string | null;
          likes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id: string;
          type: PostType;
          content: string;
          media_url?: string | null;
          thumbnail_url?: string | null;
          likes?: number;
          created_at?: string;
        };
        Update: {
          content?: string;
          media_url?: string | null;
          thumbnail_url?: string | null;
          likes?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'posts_place_id_fkey';
            columns: ['place_id'];
            referencedRelation: 'places';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          place_id: string;
          date: string;
          start_time: string;
          end_time: string | null;
          image_url: string | null;
          category: EventCategory;
          ticket_url: string | null;
          price: number | null;
          creator_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          place_id: string;
          date: string;
          start_time: string;
          end_time?: string | null;
          image_url?: string | null;
          category: EventCategory;
          ticket_url?: string | null;
          price?: number | null;
          creator_id?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          place_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          image_url?: string | null;
          category?: EventCategory;
          ticket_url?: string | null;
          price?: number | null;
          creator_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_place_id_fkey';
            columns: ['place_id'];
            referencedRelation: 'places';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      event_attendees: {
        Row: {
          event_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_attendees_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'event_attendees_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'comments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'follows_following_id_fkey';
            columns: ['following_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          media_url: string;
          thumbnail_url: string | null;
          media_type: 'photo' | 'video';
          media_width: number | null;
          media_height: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          media_url: string;
          thumbnail_url?: string | null;
          media_type: 'photo' | 'video';
          media_width?: number | null;
          media_height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          media_url?: string;
          thumbnail_url?: string | null;
          media_type?: 'photo' | 'video';
          media_width?: number | null;
          media_height?: number | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'post_media_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      user_explorations: {
        Row: {
          user_id: string;
          place_id: string;
          explored_at: string;
          exploration_method: ExplorationMethod;
        };
        Insert: {
          user_id: string;
          place_id: string;
          explored_at?: string;
          exploration_method: ExplorationMethod;
        };
        Update: {
          explored_at?: string;
          exploration_method?: ExplorationMethod;
        };
        Relationships: [
          {
            foreignKeyName: 'user_explorations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'user_explorations_place_id_fkey';
            columns: ['place_id'];
            referencedRelation: 'places';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      trails: {
        Row: {
          id: string;
          name: string;
          description: string;
          elevation: string;
          distance: string;
          duration: string;
          difficulty: TrailDifficulty;
          highlights: string[];
          trailhead: { latitude: number; longitude: number; label: string };
          coordinates: { latitude: number; longitude: number }[];
          place_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          elevation: string;
          distance: string;
          duration: string;
          difficulty: TrailDifficulty;
          highlights: string[];
          trailhead: Record<string, any>;
          coordinates: Record<string, any>[];
          place_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          elevation?: string;
          distance?: string;
          duration?: string;
          difficulty?: TrailDifficulty;
          highlights?: string[];
          trailhead?: Record<string, any>;
          coordinates?: Record<string, any>[];
          place_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trails_place_id_fkey';
            columns: ['place_id'];
            referencedRelation: 'places';
            referencedColumns: ['id'];
            isOneToOne: true;
          },
        ];
      };
      achievement_definitions: {
        Row: {
          id: string;
          type: AchievementType;
          title: string;
          description: string;
          icon_name: string;
          requirement: Record<string, any>;
          badge_color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          type: AchievementType;
          title: string;
          description: string;
          icon_name: string;
          requirement: Record<string, any>;
          badge_color: string;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          type?: AchievementType;
          title?: string;
          description?: string;
          icon_name?: string;
          requirement?: Record<string, any>;
          badge_color?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          progress: Record<string, any>;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: Record<string, any>;
        };
        Update: {
          unlocked_at?: string;
          progress?: Record<string, any>;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            referencedRelation: 'achievement_definitions';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      saved_items: {
        Row: {
          user_id: string;
          item_type: SavedItemType;
          item_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          item_type: SavedItemType;
          item_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          item_type?: SavedItemType;
          item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_items_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          type: NotificationType;
          post_id: string | null;
          guide_id: string | null;
          event_id: string | null;
          comment_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          type: NotificationType;
          post_id?: string | null;
          guide_id?: string | null;
          event_id?: string | null;
          comment_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'notifications_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'notifications_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'notifications_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'notifications_comment_id_fkey';
            columns: ['comment_id'];
            referencedRelation: 'comments';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      instagram_connections: {
        Row: {
          id: string;
          user_id: string;
          instagram_user_id: string;
          instagram_username: string;
          access_token: string;
          token_expires_at: string;
          connected_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_user_id: string;
          instagram_username: string;
          access_token: string;
          token_expires_at: string;
          connected_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instagram_user_id?: string;
          instagram_username?: string;
          access_token?: string;
          token_expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_connections_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: true;
          },
        ];
      };
      hashtags: {
        Row: {
          id: string;
          name: string;
          post_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          post_count?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          post_count?: number;
        };
        Relationships: [];
      };
      post_hashtags: {
        Row: {
          post_id: string;
          hashtag_id: string;
        };
        Insert: {
          post_id: string;
          hashtag_id: string;
        };
        Update: {
          post_id?: string;
          hashtag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_hashtags_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'post_hashtags_hashtag_id_fkey';
            columns: ['hashtag_id'];
            referencedRelation: 'hashtags';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      guides: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          likes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guides_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      guide_places: {
        Row: {
          guide_id: string;
          place_id: string;
          sort_order: number;
          note: string | null;
          added_at: string;
        };
        Insert: {
          guide_id: string;
          place_id: string;
          sort_order: number;
          note?: string | null;
          added_at?: string;
        };
        Update: {
          sort_order?: number;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'guide_places_guide_id_fkey';
            columns: ['guide_id'];
            referencedRelation: 'guides';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'guide_places_place_id_fkey';
            columns: ['place_id'];
            referencedRelation: 'places';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      guide_likes: {
        Row: {
          guide_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          guide_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          guide_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guide_likes_guide_id_fkey';
            columns: ['guide_id'];
            referencedRelation: 'guides';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'guide_likes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      guide_comments: {
        Row: {
          id: string;
          guide_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          guide_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guide_comments_guide_id_fkey';
            columns: ['guide_id'];
            referencedRelation: 'guides';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'guide_comments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      push_tokens: {
        Row: {
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          created_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          token?: string;
          platform?: 'ios' | 'android';
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          likes: boolean;
          comments: boolean;
          follows: boolean;
          comment_replies: boolean;
          event_attendance: boolean;
          event_reminders: boolean;
          guide_likes: boolean;
          guide_comments: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          likes?: boolean;
          comments?: boolean;
          follows?: boolean;
          comment_replies?: boolean;
          event_attendance?: boolean;
          event_reminders?: boolean;
          guide_likes?: boolean;
          guide_comments?: boolean;
          updated_at?: string;
        };
        Update: {
          push_enabled?: boolean;
          likes?: boolean;
          comments?: boolean;
          follows?: boolean;
          comment_replies?: boolean;
          event_attendance?: boolean;
          event_reminders?: boolean;
          guide_likes?: boolean;
          guide_comments?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
            isOneToOne: true;
          },
        ];
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          points: number;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          points: number;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          points?: number;
          reference_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_point_totals: {
        Row: {
          user_id: string;
          total_points: number;
          level: number;
          points_by_action: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_points?: number;
          level?: number;
          points_by_action?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_points?: number;
          level?: number;
          points_by_action?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    Functions: {
      delete_user_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      enrich_event_description: {
        Args: { event_id: string; new_description: string };
        Returns: undefined;
      };
    };
    Enums: {
      place_category: PlaceCategory;
      post_type: PostType;
      event_category: EventCategory;
      trail_difficulty: TrailDifficulty;
      exploration_method: ExplorationMethod;
      notification_type: NotificationType;
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {};
  };
};

export type PlaceCategory = 'cafe' | 'restaurant' | 'bar' | 'attraction' | 'park' | 'venue' | 'trail' | 'shop';
export type PostType = 'photo' | 'video' | 'text';
export type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural' | 'volunteering';
export type TrailDifficulty = 'easy' | 'moderate' | 'hard';
export type ExplorationMethod = 'viewed' | 'posted';
export type AchievementType = 'category' | 'milestone' | 'neighborhood' | 'social' | 'level' | 'activity' | 'wellington';
export type NotificationType = 'like' | 'comment' | 'follow' | 'guide_like' | 'guide_comment' | 'event_attendance' | 'event_reminder' | 'comment_reply';
export type SavedItemType = 'post' | 'place' | 'event' | 'guide';
export type NotInterestedItemType = 'event' | 'place';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
