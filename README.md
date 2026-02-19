# 🗺️ Welly — Discover Wellington Through People You Trust

A map-based social platform for discovering things to do in Wellington, New Zealand. Follow friends and local creators, see their recommendations on an interactive map, and never miss what's happening in the city.

## ✨ Core Concept

- 🗺️ **Map-First Discovery** — Browse recommendations on an interactive map, explore neighborhoods, and find what's nearby
- 👥 **Social Recommendations** — Follow friends and local creators whose taste you trust
- 📸 **Multiple Post Types** — Share places through photos, videos, or text reviews
- 🎉 **Events Hub** — Discover gigs, markets, festivals, and more happening around Wellington
- 🏆 **Exploration & Achievements** — Track places you've visited and unlock badges
- 🥾 **Trails** — Discover and follow walking trails around the city

## 📱 Features

### 🗺️ Map
- Interactive map with popularity-scaled markers
- Filter by category (cafes, bars, restaurants, parks, attractions, venues)
- Filter by people you follow
- Walking trail overlays with difficulty ratings
- Fog-of-war overlay revealing areas you've explored
- Neighborhood labels
- Upcoming event markers

### 📰 Feed
- Scrollable feed of posts from people you follow
- Like, comment, and save posts
- Double-tap to like with haptic feedback
- Media carousel for multi-photo/video posts
- Zoomable images

### 🔍 Search
- Unified search across places, users, and events
- Quick access to discovery and exploration

### 🎉 Events
- Browse upcoming Wellington events with filtering
- Filter by date range, category, free/paid, and following
- Drawer-based filter UI
- Add events to your calendar
- Ticket links and pricing info

### ✍️ Create
- Floating create button accessible from any tab
- Photo, video, and text post types
- Place search with Google Places integration
- Media compression before upload
- Share extension support (share from other apps directly into Welly)

### 👤 Profile
- Your posts in a masonry grid layout
- Edit profile (username, display name, avatar, bio)
- Followers / following lists
- Saved posts, places, and events
- Achievements and exploration stats
- Notifications with badge count
- Discover new users to follow

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| UI | React 19 |
| Routing | Expo Router v6 with NativeTabs |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Maps | react-native-maps |
| Location | expo-location |
| Animations | react-native-reanimated + react-native-gesture-handler |
| Graphics | @shopify/react-native-skia (fog-of-war) |
| Data Fetching | @tanstack/react-query |
| Auth | Supabase Auth (Apple Sign-In, email) |
| Fonts | Plus Jakarta Sans, Pacifico |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (development build required — not Expo Go)
- Supabase CLI (for local database)

### Installation

```bash
git clone <repository-url>
cd wellington-app
npm install --legacy-peer-deps
```

### Database Setup (Local)

```bash
npm run db:start        # Start local Supabase
npm run db:reset        # Apply schema + seed data
npm run db:types        # Generate TypeScript types
```

### Running the App

```bash
npx expo start          # Start dev server
npx expo run:ios        # Build & run on iOS
npx expo run:android    # Build & run on Android
```

### Database Scripts

| Script | Description |
|---|---|
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset database (schema + migrations + seed) |
| `npm run db:types` | Generate TypeScript types from schema |
| `npm run db:migrate` | Run migrations locally |
| `npm run db:setup:remote` | Full remote database setup |

## 📂 Project Structure

```
wellington-app/
├── app/                     # 📁 File-based routing (Expo Router)
│   ├── _layout.tsx          #    Root layout (providers, auth gate)
│   ├── login.tsx            #    Login screen
│   ├── onboarding.tsx       #    Onboarding flow
│   └── (tabs)/              #    Tab navigator
│       ├── map/             #    🗺️ Map tab (+ place, post, user, trail, event routes)
│       ├── search/          #    🔍 Search tab
│       ├── feed/            #    📰 Feed tab (+ place, post, user, likes routes)
│       ├── events/          #    🎉 Events tab (+ event detail, filter drawer)
│       └── profile/         #    👤 Profile tab (+ edit, achievements, saved, notifications)
├── src/
│   ├── screens/             # 📱 Screen components
│   ├── components/          # 🧩 Reusable UI components
│   ├── context/             # 🔄 React context providers
│   ├── services/            # 🌐 Supabase API service layer
│   ├── hooks/               # 🪝 Custom React hooks
│   ├── types/               # 📝 TypeScript type definitions
│   ├── utils/               # 🔧 Utility functions
│   ├── data/                # 📊 Achievement definitions, neighborhood data
│   ├── lib/                 # 📚 Supabase client setup
│   └── theme/               # 🎨 Colors and fonts
├── supabase/                # 🗄️ Database schema, migrations, and seed data
└── assets/                  # 🖼️ App icons, splash screen
```

## 📄 License

MIT
