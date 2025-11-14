export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  category: string;
  coords: Coordinates;
  imageUrl?: string;
  address?: string;
  openingHours?: string;
  website?: string;
  rating?: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  coords?: Coordinates;
  imageUrl?: string;
  category: string;
  price?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  coords: Coordinates;
  rating?: number;
  priceRange?: string;
  imageUrl?: string;
  address?: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AttractionDetail: { attractionId: string };
  EventDetail: { eventId: string };
  RestaurantDetail: { restaurantId: string };
};

export type MainTabParamList = {
  Discover: undefined;
  Food: undefined;
  Events: undefined;
  Transport: undefined;
  More: undefined;
};
