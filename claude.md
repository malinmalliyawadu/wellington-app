# Wellington App - Project Context

## What This App Is

Wellington App is a map-based social platform for discovering things to do in Wellington, New Zealand. It combines social following (like Instagram) with map-based discovery (like Google Maps) to help users find authentic local recommendations.

## Core User Experience

1. **Follow people you trust** - Friends, local food bloggers, event promoters, creators
2. **See their recommendations on a map** - Browse what's nearby or explore neighborhoods
3. **Multiple ways to share** - Photo posts, short videos, text reviews
4. **Discover events** - Find what's happening around the city

## Key Screens

- **Map View** - Primary discovery interface showing pins for recommended places
- **Feed** - Scrollable feed of posts from followed accounts
- **Events** - Calendar/list of upcoming events in Wellington
- **Create Post** - Share a place with photo/video/text
- **Profile** - User's posts, saved places, followers/following
- **Place Detail** - All posts and info about a specific location

## Technical Decisions

- **React Native + Expo** - Cross-platform mobile development
- **TypeScript** - Type safety throughout
- **React Navigation** - Tab-based navigation with stack navigators

## Design Principles

- Map is central to the experience
- Social trust drives discovery (recommendations from people you follow)
- Low friction posting - make it easy to share a quick recommendation
- Wellington-focused - this is specifically for Wellington, not a generic platform

## Data Model Concepts

- **User** - Profile, followers, following
- **Post** - Photo/video/text content linked to a Place
- **Place** - A location (cafe, bar, park, venue, etc.)
- **Event** - Time-bound happening at a Place
