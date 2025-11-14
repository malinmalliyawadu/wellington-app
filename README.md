# Wellington App

Your all-in-one companion for exploring Wellington, New Zealand's coolest little capital.

## Overview

Wellington App is a comprehensive mobile application designed to help both tourists and locals discover the best of Wellington. From top attractions and hidden gems to food, events, and transport - everything you need is in one place.

## Features

### Current Features
- **Discover**: Browse top attractions including Te Papa Museum, Wellington Cable Car, Zealandia, and more
- **Category Navigation**: Easily find what you're looking for with organized categories
- **Beautiful UI**: Clean, modern interface with Wellington-themed colors

### Planned Features
- **Food & Coffee**: Discover Wellington's renowned cafe culture and dining scene
- **Events Calendar**: Stay updated on festivals, shows, and happenings
- **Transport Integration**: Real-time public transport information (Metlink)
- **Interactive Maps**: GPS-enabled navigation with AR features
- **Walking Tours**: Self-guided audio tours of Wellington's highlights
- **Offline Mode**: Download content for offline access
- **Weather Updates**: Wellington's famous weather at your fingertips
- **Emergency Information**: Essential contacts and tourist help

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

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## About Wellington

Wellington is New Zealand's capital city, known for:
- Vibrant creative and cultural scene
- World-class museums and attractions
- Outstanding coffee culture (top 8 coffee city globally)
- Beautiful harbour and green spaces
- Film industry connections (Weta Workshop, LOTR)
- Diverse food scene and craft beer
- Compact, walkable city center

## License

MIT

## Acknowledgments

- Attractions data inspired by Tourism New Zealand
- Built with Expo and React Native
- Icons and emojis for visual elements
