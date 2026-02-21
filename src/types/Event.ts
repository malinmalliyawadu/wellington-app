export type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural';

export interface Event {
  id: string;
  title: string;
  description: string;
  placeId: string;
  date: string;
  startTime: string;
  endTime?: string;
  imageUrl?: string;
  category: EventCategory;
  attendeeIds?: string[];
  ticketUrl?: string;
  price?: number | null;
  creatorId?: string;
}
