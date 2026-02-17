import { Redirect } from 'expo-router';

export default function NotFound() {
  // Handles unmatched routes including expo-share-intent's
  // "wellington://dataUrl=..." callback URL.
  // The share intent data is picked up by useShareIntent in _layout.tsx.
  return <Redirect href="/(tabs)/map" />;
}
