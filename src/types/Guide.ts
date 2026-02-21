export interface Guide {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  firstPlaceImageUrl?: string;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuidePlace {
  guideId: string;
  placeId: string;
  sortOrder: number;
  note?: string;
  addedAt: string;
}

export interface GuideWithPlaces extends Guide {
  creatorName?: string;
  places: { name: string; category: string; note?: string }[];
}
