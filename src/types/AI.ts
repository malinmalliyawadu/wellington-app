export interface AIPlaceRecommendation {
  placeId: string;
  placeName: string;
  category: string;
  reason: string;
}

export interface AIEventRecommendation {
  eventId: string;
  eventTitle: string;
  date: string;
  startTime?: string;
  reason: string;
}

export interface AIGuideRecommendation {
  guideId: string;
  guideTitle: string;
  creatorName: string;
  placeCount: number;
  reason: string;
}

export interface AIResponse {
  message: string;
  places: AIPlaceRecommendation[];
  events: AIEventRecommendation[];
  guides: AIGuideRecommendation[];
  followUp?: string;
  followUpPrompts?: { label: string; prompt: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  aiResponse?: AIResponse;
  error?: string;
}
