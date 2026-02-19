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

export interface AIResponse {
  message: string;
  places: AIPlaceRecommendation[];
  events: AIEventRecommendation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  aiResponse?: AIResponse;
  error?: string;
}
