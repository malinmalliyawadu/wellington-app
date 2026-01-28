# Wellington App

A map-based social platform for discovering what to do in Wellington through friends and creators.

## Overview

Wellington App is a social discovery platform that combines the best of Instagram and Google Maps. Follow friends and local creators to find authentic recommendations for places to visit, eat, and explore in Wellington. Think of it as your personalized, social guide to the city.

## Core Concept

- **Map-First Discovery**: Browse recommendations on an interactive map to find things nearby or explore different neighborhoods
- **Social Recommendations**: Follow friends and local creators whose taste you trust
- **Multiple Post Types**: Share places through photos (like IG), short videos (like TikTok), or simple text reviews
- **Events Hub**: Discover events happening around Wellington - gigs, markets, festivals, and more

## Features

### Planned Features
- **Map View**: Interactive map showing recommendations from people you follow
- **Feed**: Scroll through posts from friends and creators
- **Post Creation**: Share places with photos, videos, or text
- **Events Calendar**: Browse upcoming events in Wellington
- **Profile**: Your posts, saved places, and followers
- **Search**: Find places, people, or events
- **Place Pages**: See all posts about a specific location

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Platform**: iOS & Android

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wellington-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- Download Expo Go app on your phone
- Scan the QR code from the terminal
- Or press `i` for iOS simulator or `a` for Android emulator

## Project Structure

```
wellington-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API calls and data services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # App constants and data
│   └── theme/           # Colors, typography, spacing
├── assets/              # Images, fonts, etc.
├── App.tsx             # Root component
└── package.json        # Dependencies
```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## License

MIT
