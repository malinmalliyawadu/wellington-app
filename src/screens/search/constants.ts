import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import type { Place, Post, User, Event, PlaceCategory, Hashtag, Guide } from "../../types";

// ─── Constants ───────────────────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<
  PlaceCategory,
  { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
  shop: { sf: "bag.fill", fallback: "bag" },
};

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafes",
  restaurant: "Restaurants",
  bar: "Bars",
  attraction: "Attractions",
  park: "Parks",
  venue: "Venues",
  trail: "Trails",
  shop: "Shops",
};

export const ALL_CATEGORIES: PlaceCategory[] = [
  "cafe",
  "restaurant",
  "bar",
  "attraction",
  "park",
  "venue",
  "trail",
  "shop",
];

export type FilterType =
  | "all"
  | "places"
  | "people"
  | "events"
  | "guides"
  | "hashtags";

export const FILTER_CHIPS: {
  key: FilterType;
  label: string;
  icon: SFSymbol;
  fallback: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "all", label: "All", icon: "sparkle", fallback: "sparkles" },
  { key: "places", label: "Places", icon: "mappin", fallback: "location" },
  { key: "people", label: "People", icon: "person.fill", fallback: "person" },
  {
    key: "events",
    label: "Events",
    icon: "calendar",
    fallback: "calendar",
  },
  { key: "guides", label: "Guides", icon: "book.fill", fallback: "book" },
  {
    key: "hashtags",
    label: "Hashtags",
    icon: "number",
    fallback: "pricetag",
  },
];

export const FILTER_TO_SECTION: Record<FilterType, string | null> = {
  all: null,
  places: "Places",
  people: "People",
  events: "Events",
  guides: "Guides",
  hashtags: "Hashtags",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  type: "place" | "post" | "user" | "event" | "hashtag" | "guide";
  data: Place | Post | User | Event | Omit<Place, "id"> | Hashtag | Guide;
  source?: "google";
}
