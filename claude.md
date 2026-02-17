# Wellington App - Project Context

## What This App Is

Wellington App is a map-based social platform for discovering things to do in Wellington, New Zealand. It combines social following (like Instagram) with map-based discovery (like Google Maps) to help users find authentic local recommendations.

## Core User Experience

1. **Follow people you trust** - Friends, local food bloggers, event promoters, creators
2. **See their recommendations on a map** - Browse what's nearby or explore neighborhoods
3. **Multiple ways to share** - Photo posts, short videos, text reviews
4. **Discover events** - Find what's happening around the city

## Tech Stack

- **React Native 0.81 + Expo SDK 54** - Cross-platform mobile development
- **TypeScript 5.9** - Type safety throughout
- **Expo Router v6** with `NativeTabs` (`expo-router/unstable-native-tabs`) - File-based routing
- **react-native-maps** - Map view
- **expo-location** - User geolocation
- **React 19** - UI framework

## App Structure

### Routing (`app/`)

File-based routing with 5 tabs, each containing an independent stack navigator:

```
app/
  _layout.tsx              # Root: SafeAreaProvider → Providers → AuthGate (with share intent handling) → Slot
  (tabs)/
    _layout.tsx            # NativeTabs: Map, Feed, Events, Create, Profile
    map/
      _layout.tsx          # Stack: index, place/[placeId], post/[postId], user/[userId]
      index.tsx
      place/[placeId].tsx
      post/[postId].tsx
      user/[userId].tsx
    feed/
      _layout.tsx          # Stack: index, user/[userId], follow-list, discover, place/[placeId], post/[postId]
      index.tsx
      user/[userId].tsx
      follow-list.tsx
      discover.tsx
      place/[placeId].tsx
      post/[postId].tsx
    events/
      _layout.tsx          # Stack: index, [eventId]
      index.tsx
      [eventId].tsx
    profile/
      _layout.tsx          # Stack: index, user/[userId], follow-list, discover, place/[placeId], post/[postId]
      index.tsx
      user/[userId].tsx
      follow-list.tsx
      discover.tsx
      place/[placeId].tsx
      post/[postId].tsx
    create.tsx
```

Route files are thin re-exports: `export { ScreenName as default } from '../../src/screens/ScreenName'`

### Screens (`src/screens/`)

| Screen | Description |
|---|---|
| `MapScreen` | Primary map view with popularity markers, search bar, category/following filters |
| `FeedScreen` | Scrollable feed of posts from followed users with like/comment actions |
| `CreateScreen` | Post creation form with type selector, place picker, content input |
| `ProfileScreen` | Current user profile with stats, post grid |
| `UserProfileScreen` | Other users' profiles with follow button, post grid |
| `PlacePostsSheetScreen` | **Full-screen modal** showing all posts for a place (opened from MapScreen markers) |
| `PlaceDetailScreen` | All posts for a place, sorted by followed-first then likes |
| `PostDetailScreen` | Instagram-style single post view with likes, comments, place tag |
| `EventsScreen` | List of upcoming Wellington events |
| `EventDetailScreen` | Full event details with attendee list |
| `FollowListScreen` | Followers/following list with tab switcher |
| `DiscoverUsersScreen` | Browse and follow new users |

### Components (`src/components/`)

| Component | Description |
|---|---|
| `FeedPost` | Post card in feed: user header, media, caption, place badge, like/comment actions |
| `PopularityMarker` | Map marker sized by popularity, styled by category and follow status |
| `MapSearchBar` | Search input + category/following filter chips for map |
| `EventCard` | Event card with image, date, title, attendee avatars |
| `FollowButton` | Follow/Following toggle button using FollowContext |
| `PlaceCard` | Compact place info card |

**Note:** `PlacePostsSheet` (component) is deprecated. Use `PlacePostsSheetScreen` (screen) instead - accessed via routing from MapScreen.

### Context (`src/context/`)

| Context | State | Methods |
|---|---|---|
| `FollowContext` | `followingIds: string[]` | `isFollowing(userId)`, `toggleFollow(userId)` |
| `LikeContext` | `likedPostIds: string[]`, `likeCounts: Record<string, number>` | `isLiked(postId)`, `toggleLike(postId)`, `getLikeCount(postId)` |

### Data (`src/data/`)

All mock data, no backend. Helpers follow the pattern `getXById(id)`, `getXsByYId(yId)`.

| File | Contents |
|---|---|
| `mockUsers.ts` | 10 users (1 current + 9 creators). `getUserById()`, `getOtherUsers()` |
| `mockPlaces.ts` | 22 Wellington places (cafes, bars, restaurants, parks, attractions, venues). `getPlaceById()` |
| `mockPosts.ts` | 48 posts with Unsplash images. `getPostById()`, `getPostsByPlaceId()`, `getPostsByUserId()` |
| `mockEvents.ts` | 25 events (heavy on gigs/music). `getEventById()`, `getUpcomingEvents()` |
| `mockComments.ts` | 40 comments. `getCommentsByPostId()` |
| `mockFollows.ts` | `initialFollowingIds: ['u1', 'u3']` |

### Types (`src/types/`)

- **User** - `id, username, displayName, avatarUrl, bio?`
- **Post** - `id, userId, placeId, type (photo|video|text), content, mediaUrl?, likes, createdAt`
- **Place** - `id, name, category (cafe|restaurant|bar|attraction|park|venue), address, latitude, longitude`
- **Event** - `id, title, description, placeId, date, startTime, endTime?, imageUrl?, category (music|comedy|art|food|market|community), attendeeIds`

### Utils (`src/utils/`)

**`placePopularity.ts`**
- `computePlacePopularity(posts)` - Aggregates posts into `PlacePopularity` map (postCount, totalLikes, score, posterIds)
- `getMarkerSize(score, allPopularities)` - Linear interpolation for marker size (28-52px)
- `isFollowedPlace(posterIds, followingIds)` - Checks if any poster is followed

**`sharing.ts`** - Deep link URL generators and share helpers
- `getPostUrl(postId)`, `getPlaceUrl(placeId)`, `getEventUrl(eventId)`, `getUserUrl(userId)` - Generate `wellington:///` deep link URLs via `expo-linking` `createURL()`
- `sharePost(postId, placeName, content)`, `shareEvent(eventId, title, date, placeName, description)` - Call `Share.share()` with message text + deep link URL appended

### Theme (`src/theme/colors.ts`)

- Brand: `primary` (#00A5E0), `primaryDark` (#0086B8)
- Category colors: cafe (brown), restaurant (orange), bar (purple), attraction (blue), park (green), venue (red)
- Interactive: `liked` (#E0245E) for heart icons
- Grays: `gray100` through `gray600`
- Text: `text`, `textSecondary`, `textMuted`

## Key Patterns

- **Shared screens across tabs**: `UserProfileScreen`, `FollowListScreen`, `DiscoverUsersScreen` use `usePathname()` to determine the current tab and build tab-relative paths (e.g. `/feed/user/123` vs `/map/user/123`)
- **Post sorting**: Followed users' posts appear first, then sorted by likes
- **Popularity markers**: Map markers scale with engagement (posts + likes), filled for followed places, outlined for unfollowed
- **Like state shared globally**: Liking a post in the map sheet persists when viewing the same post in feed or detail view
- **Deep linking**: URL scheme `wellington://` configured in `app.json`. Expo Router auto-handles incoming deep links by matching paths to file-based routes. Share helpers in `src/utils/sharing.ts` generate deep link URLs for shared content.
- **Share extension**: `expo-share-intent` registers the app as an iOS/Android share target. Incoming shared `wellington://` URLs are parsed and navigated to in `AuthGate` (`app/_layout.tsx`). Requires a development build (not Expo Go).

## Design Principles

- Map is central to the experience
- Social trust drives discovery (recommendations from people you follow)
- Low friction posting - make it easy to share a quick recommendation
- Wellington-focused - this is specifically for Wellington, not a generic platform
