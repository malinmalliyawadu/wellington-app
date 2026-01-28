export interface Event {
  id: string;
  title: string;
  description: string;
  placeId: string;
  date: string;
  startTime: string;
  endTime?: string;
  imageUrl?: string;
  category: 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community';
}
