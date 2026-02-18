import { Region } from "react-native-maps";

export const WELLINGTON_REGION: Region = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

export const WELLINGTON_BOUNDS = {
  north: -41.05,
  south: -41.38,
  west: 174.6,
  east: 174.95,
};

export function isInWellington(lat: number, lng: number): boolean {
  return (
    lat >= WELLINGTON_BOUNDS.south &&
    lat <= WELLINGTON_BOUNDS.north &&
    lng >= WELLINGTON_BOUNDS.west &&
    lng <= WELLINGTON_BOUNDS.east
  );
}
