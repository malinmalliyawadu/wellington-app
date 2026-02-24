# Wellington App - Project Context

## What This App Is

Welly is a map-based social platform for discovering things to do in Wellington, New Zealand. It combines social following (like Instagram) with map-based discovery (like Google Maps) to help users find authentic local recommendations.

## Core User Experience

1. **Follow people you trust** - Friends, local food bloggers, event promoters, creators
2. **See their recommendations on a map** - Browse what's nearby or explore neighborhoods
3. **Multiple ways to share** - Photo posts, short videos, text reviews
4. **Discover events** - Find what's happening around the city
5. **Track your exploration** - See where you've been, unlock achievements

## Tech Stack

- **React Native 0.81 + Expo SDK 54** - Cross-platform mobile development
- **TypeScript 5.9** - Type safety throughout
- **React 19** - UI framework
- **Expo Router v6** with `NativeTabs` (`expo-router/unstable-native-tabs`) - File-based routing
- **Supabase** - Backend (Auth, PostgreSQL, Storage)
- **@tanstack/react-query** - Data fetching and caching
- **react-native-maps** - Map view
- **expo-location** - User geolocation
- **react-native-reanimated** + **react-native-gesture-handler** - Animations and gestures
- **@shopify/react-native-skia** - Fog-of-war canvas rendering
- **expo-share-intent** - Share extension (receive content from other apps)

## App Structure

### Routing (`app/`)

File-based routing with 5 tabs, each containing an independent stack navigator. Some tabs use drawer layouts for filters.

```
app/
  _layout.tsx              # Root: QueryClient → GestureHandler → Providers → AuthGate → Slot
  login.tsx                # Login screen (Supabase Auth, Apple Sign-In)
  onboarding.tsx           # Onboarding flow for new users
  index.tsx                # Entry redirect
  +not-found.tsx           # 404 handler
  (tabs)/
    _layout.tsx            # NativeTabs: Map, Search, Feed, Events, Profile
    map/
      _layout.tsx          # Stack navigator
      (drawer)/            # Drawer for map filters
        _layout.tsx
        index.tsx          # MapScreen
      place/[placeId].tsx
      place-posts/[placeId].tsx
      post/[postId].tsx
      user/[userId].tsx
      trail/[trailId].tsx
      event/[eventId].tsx
      create-post.tsx
      place-search.tsx
      likes.tsx
    search/
      _layout.tsx          # Stack navigator
      index.tsx            # SearchScreen
      place/[placeId].tsx
      post/[postId].tsx
      user/[userId].tsx
      event/[eventId].tsx
      create-post.tsx
    feed/
      _layout.tsx          # Stack navigator
      index.tsx            # FeedScreen
      user/[userId].tsx
      follow-list.tsx
      discover.tsx
      place/[placeId].tsx
      post/[postId].tsx
      create-post.tsx
      place-search.tsx
      likes.tsx
    events/
      _layout.tsx          # Stack navigator
      (drawer)/            # Drawer for event filters
        _layout.tsx
        index.tsx          # EventsScreen
      [eventId].tsx
      create-post.tsx
      place-search.tsx
      user/[userId].tsx
    profile/
      _layout.tsx          # Stack navigator
      index.tsx            # ProfileScreen
      user/[userId].tsx
      follow-list.tsx
      discover.tsx
      edit-profile.tsx
      achievements.tsx
      saved.tsx
      notifications.tsx
      place/[placeId].tsx
      post/[postId].tsx
      create-post.tsx
      likes.tsx
```

Route files are thin re-exports: `export { ScreenName as default } from '../../src/screens/ScreenName'`

### Screens (`src/screens/`)

| Screen                   | Description                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `MapScreen`              | Primary map view with popularity markers, filter drawer, trail overlays, fog-of-war, event markers |
| `FeedScreen`             | Scrollable feed of posts from followed users with like/comment/save actions                        |
| `SearchScreen`           | Unified search across places, users, and events                                                    |
| `EventsScreen`           | List of upcoming Wellington events with filter drawer (date, category, free, following)            |
| `EventDetailScreen`      | Full event details with attendees, ticket link, add-to-calendar                                    |
| `CreatePostSheetScreen`  | Post creation form with type selector, place picker (Google Places), media upload                  |
| `ProfileScreen`          | Current user profile with stats, post masonry grid, navigation to settings                         |
| `UserProfileScreen`      | Other users' profiles with follow button, post grid                                                |
| `EditProfileScreen`      | Edit username, display name, avatar, bio                                                           |
| `PlacePostsSheetScreen`  | Full-screen modal showing all posts for a place (opened from MapScreen markers)                    |
| `PlaceDetailScreen`      | All posts for a place, sorted by followed-first then likes                                         |
| `PlaceSearchSheet`       | Google Places-powered place picker for post creation                                               |
| `PostDetailScreen`       | Single post view with likes, comments, place tag, zoomable media                                   |
| `TrailDetailSheetScreen` | Trail details with elevation, distance, difficulty, highlights                                     |
| `FollowListScreen`       | Followers/following list with tab switcher                                                         |
| `DiscoverUsersScreen`    | Browse and follow new users                                                                        |
| `LikesListScreen`        | List of users who liked a post                                                                     |
| `SavedScreen`            | Saved posts, places, and events (tabbed)                                                           |
| `AchievementsScreen`     | Exploration achievements and progress                                                              |
| `NotificationsScreen`    | Notification list with unread indicators                                                           |
| `LoginScreen`            | Supabase auth with Apple Sign-In                                                                   |
| `OnboardingScreen`       | New user onboarding flow                                                                           |

### Components (`src/components/`)

| Component              | Description                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `FeedPost`             | Post card in feed: user header, media carousel, caption, place badge, like/comment/save/share |
| `MediaCarousel`        | Swipeable photo/video carousel with pagination dots                                           |
| `VideoPlayer`          | Video playback component with controls                                                        |
| `VideoThumbnail`       | Video thumbnail with play icon overlay                                                        |
| `ZoomableImage`        | Pinch-to-zoom image with global zoom overlay                                                  |
| `PopularityMarker`     | Map marker sized by popularity, styled by category and follow status                          |
| `MapSearchBar`         | Search input + filter toggle for map                                                          |
| `MapControls`          | Map control buttons (location, zoom)                                                          |
| `MapFilterDrawer`      | Drawer with category, following, trail, and event filters                                     |
| `TrailOverlay`         | Trail polyline overlay on the map                                                             |
| `NeighborhoodOverlay`  | Neighborhood labels on the map                                                                |
| `FogOfWarOverlay`      | Skia canvas overlay revealing explored areas                                                  |
| `EventCard`            | Event card with image, date, title, attendee avatars                                          |
| `EventFilterDrawer`    | Drawer with date, category, price, and following filters                                      |
| `UpcomingEvents`       | Horizontal scrollable event list for map                                                      |
| `FollowButton`         | Follow/Following toggle button                                                                |
| `PlaceCard`            | Compact place info card                                                                       |
| `PostsGrid`            | Masonry grid for displaying posts                                                             |
| `AchievementCard`      | Achievement badge with progress                                                               |
| `AchievementsList`     | Full achievements list                                                                        |
| `FloatingCreateButton` | FAB for post creation from any tab                                                            |
| `HapticPressable`      | Pressable with haptic feedback                                                                |
| `LiquidGlassButton`    | Translucent glass-effect button                                                               |
| `SFIcon`               | SF Symbols icon wrapper                                                                       |
| `create/PostForm`      | Post creation form component                                                                  |
| `create/PlacePicker`   | Place selection component                                                                     |
| `create/EventForm`     | Event creation form component                                                                 |

### Context (`src/context/`)

| Context               | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `AuthContext`         | Supabase session, user profile, onboarding state             |
| `FollowContext`       | Following state: `isFollowing()`, `toggleFollow()`           |
| `LikeContext`         | Like state: `isLiked()`, `toggleLike()`, `getLikeCount()`    |
| `SaveContext`         | Saved items: `isSaved()`, `toggleSave()`, `getSavedIds()`    |
| `ExplorationContext`  | Explored places tracking, achievement unlocking              |
| `NotificationContext` | Notifications list, unread count, mark-as-read               |
| `LocationContext`     | User geolocation via expo-location                           |
| `MapFilterContext`    | Map filter state (categories, following, trails, events)     |
| `EventFilterContext`  | Event filter state (date range, categories, free, following) |
| `ToastContext`        | Toast notification display with haptics                      |
| `ZoomOverlayContext`  | Shared zoom state for zoomable images                        |

### Services (`src/services/`)

Supabase API layer. Each service handles CRUD operations for its domain:

| Service                 | Description                          |
| ----------------------- | ------------------------------------ |
| `auth.ts`               | Authentication helpers               |
| `users.ts`              | User profiles CRUD                   |
| `posts.ts`              | Posts CRUD with media                |
| `places.ts`             | Places CRUD                          |
| `events.ts`             | Events CRUD                          |
| `comments.ts`           | Post comments                        |
| `likes.ts`              | Post likes                           |
| `follows.ts`            | Follow/unfollow                      |
| `saves.ts`              | Saved items (posts, places, events)  |
| `explorations.ts`       | Place exploration tracking           |
| `achievements.ts`       | Achievement checking and unlocking   |
| `notifications.ts`      | Notification fetching and management |
| `trails.ts`             | Trail data fetching                  |
| `storage.ts`            | Supabase storage (media uploads)     |
| `googlePlaces.ts`       | Google Places API search             |
| `googlePlaceDetails.ts` | Google Places detail fetching        |
| `googleGeocoding.ts`    | Reverse geocoding                    |
| `mapkitSearch.ts`       | Apple MapKit search                  |

### Hooks (`src/hooks/`)

| Hook                        | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `useQuery.ts`               | Wrapper around @tanstack/react-query                          |
| `useMapData.ts`             | Fetches and combines map data (places, posts, events, trails) |
| `useDoubleTapLike.ts`       | Double-tap gesture handler for liking posts                   |
| `useExplorationTracking.ts` | Tracks when user visits a place                               |
| `useLocationTrail.ts`       | Records user's location trail for fog-of-war                  |
| `useMarkerAnimation.ts`     | Animated marker entrance effects                              |

### Data (`src/data/`)

| File                          | Contents                                                 |
| ----------------------------- | -------------------------------------------------------- |
| `achievementDefinitions.ts`   | Achievement types, requirements, icons, and badge colors |
| `neighborhoodBoundaries.json` | GeoJSON boundaries for Wellington neighborhoods          |

### Types (`src/types/`)

- **User** - `id, username, displayName, avatarUrl, bio?, onboardingCompleted?`
- **Post** - `id, userId, placeId, type (photo|video|text), content, mediaUrl?, thumbnailUrl?, mediaWidth?, mediaHeight?, likes, createdAt, media?: MediaItem[]`
- **MediaItem** - `id, mediaUrl, thumbnailUrl?, mediaType (photo|video), mediaWidth?, mediaHeight?, sortOrder`
- **Place** - `id, name, category (cafe|restaurant|bar|attraction|park|venue|trail), address, latitude, longitude, googlePlaceId?, rating?, userRatingsTotal?`
- **Event** - `id, title, description, placeId, date, startTime, endTime?, imageUrl?, category (music|comedy|art|food|market|community|quiz|craft|kids|cultural), attendeeIds?, ticketUrl?, price?`
- **Trail** - `id, name, description, elevation, distance, duration, difficulty (easy|moderate|hard), highlights, trailhead, coordinates, placeId`
- **Exploration types** - `UserExploration, AchievementDefinition, UserAchievement, AchievementProgress, ExplorationStats`
- **database.ts** - Auto-generated Supabase types (`npm run db:types`)

### Utils (`src/utils/`)

| Utility                 | Description                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `placePopularity.ts`    | Computes popularity scores, marker sizes, followed-place detection                             |
| `sharing.ts`            | Deep link URL generators (`wellington://`), share helpers, website URL support (`wellyapp.nz`) |
| `postSorting.ts`        | Sort posts by followed-first then likes                                                        |
| `postMedia.ts`          | Media URL helpers                                                                              |
| `neighborhoods.ts`      | Neighborhood lookup from coordinates                                                           |
| `achievementHelpers.ts` | Achievement progress calculation                                                               |
| `addToCalendar.ts`      | Add events to device calendar via expo-calendar                                                |
| `compressMedia.ts`      | Image/video compression before upload                                                          |
| `formatNumber.ts`       | Number formatting (1.2k, 3.4M, etc.)                                                           |

### Theme (`src/theme/`)

**`colors.ts`**

- Brand: `primary` (#00A5E0), `primaryDark` (#0086B8)
- Category colors: cafe (brown), restaurant (orange), bar (purple), attraction (blue), park (green), venue (red)
- Interactive: `liked` (#E0245E) for heart icons
- Grays: `gray100` through `gray600`
- Text: `text`, `textSecondary`, `textMuted`

**`fonts.ts`** - Plus Jakarta Sans (Medium, SemiBold, Bold, ExtraBold), Pacifico (logo/branding)

### Backend (`supabase/`)

- `schema.sql` - Full database schema (users, posts, places, events, comments, likes, follows, saves, explorations, achievements, notifications, trails)
- `seed.sql` - Seed data for development
- `migrations/` - Database migrations
- `create-seed-users.mjs` - Script to create seed auth users
- `run-sql.mjs` - Remote SQL execution helper

## CI / Quality

- **GitHub Actions** (`.github/workflows/ci.yml`) runs on push/PR to `main`: typecheck → lint → test
- **TypeScript**: `npm run typecheck` (runs `tsc --noEmit`)
- **ESLint**: `npm run lint` (runs `eslint .`) — uses `eslint-config-expo` flat config (`eslint.config.mjs`), ESLint v9
- **Jest**: `npm test` (runs `jest --passWithNoTests`) — uses `jest-expo` preset, Jest v29
- Tests live in `src/utils/__tests__/` — unit tests for utility functions
- Install dependencies with `--legacy-peer-deps` flag (required due to peer dep conflicts)

## Key Patterns

- **Shared screens across tabs**: `UserProfileScreen`, `FollowListScreen`, `DiscoverUsersScreen` use `usePathname()` to determine the current tab and build tab-relative paths (e.g. `/feed/user/123` vs `/map/user/123`)
- **Post sorting**: Followed users' posts appear first, then sorted by likes
- **Popularity markers**: Map markers scale with engagement (posts + likes), filled for followed places, outlined for unfollowed
- **Like state shared globally**: Liking a post in the map sheet persists when viewing the same post in feed or detail view
- **Deep linking**: URL scheme `wellington://` configured in `app.json`. Expo Router auto-handles incoming deep links. Share helpers generate both `wellington://` deep links and `https://wellyapp.nz` web URLs.
- **Share extension**: `expo-share-intent` registers the app as an iOS/Android share target. Incoming URLs (both `wellington://` and `wellyapp.nz`) are parsed and navigated to in `AuthGate`. External content (images, videos, text) opens the create post screen.
- **Drawer filters**: Map and Events screens use `@react-navigation/drawer` for filter panels
- **Fog-of-war**: Skia canvas renders a dark overlay with revealed circles around explored places and the user's location trail
- **Achievements**: Automatically checked and unlocked when places are explored (category-based, neighborhood-based, count-based)
- **Auth flow**: Login → Onboarding → App. `AuthGate` in root layout handles routing based on session and onboarding state.
- **Create from anywhere**: `FloatingCreateButton` + `create-post` routes in each tab allow post creation without leaving the current tab
- **Media handling**: Multi-photo/video posts with carousel display, compression before upload, Supabase Storage for hosting

## Design Principles

- Map is central to the experience
- Social trust drives discovery (recommendations from people you follow)
- Low friction posting - make it easy to share a quick recommendation
- Wellington-focused - this is specifically for Wellington, not a generic platform
- Explore and discover - gamification through fog-of-war and achievements encourages visiting new places
