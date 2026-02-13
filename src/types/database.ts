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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string;
          bio?: string | null;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: PlaceCategory;
          address: string;
          latitude: number;
          longitude: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: PlaceCategory;
          address?: string;
          latitude?: number;
          longitude?: number;
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
    };
    Views: {};
    Functions: {};
    Enums: {
      place_category: PlaceCategory;
      post_type: PostType;
      event_category: EventCategory;
      exploration_method: ExplorationMethod;
    };
    CompositeTypes: {};
  };
};

export type PlaceCategory = 'cafe' | 'restaurant' | 'bar' | 'attraction' | 'park' | 'venue';
export type PostType = 'photo' | 'video' | 'text';
export type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community';
export type ExplorationMethod = 'viewed' | 'posted';
export type AchievementType = 'category' | 'milestone' | 'neighborhood' | 'social';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
