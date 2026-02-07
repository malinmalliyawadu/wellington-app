import { Event } from '../types';

export const mockEvents: Event[] = [
  {
    id: 'e1',
    title: 'Jazz Night at San Fran',
    description: 'Live jazz quartet playing classics and contemporary pieces. Great drinks and atmosphere.',
    placeId: 'p7',
    date: '2025-01-29',
    startTime: '20:00',
    endTime: '23:00',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600',
    category: 'music',
    attendeeIds: ['u1', 'u3', 'u4', 'u2'],
  },
  {
    id: 'e2',
    title: 'Comedy Open Mic',
    description: 'Local comedians try out new material. Always a fun night with plenty of laughs.',
    placeId: 'p7',
    date: '2025-01-30',
    startTime: '19:30',
    endTime: '22:00',
    imageUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600',
    category: 'comedy',
    attendeeIds: ['u4', 'u5'],
  },
  {
    id: 'e3',
    title: 'Craft Beer Tasting',
    description: 'Sample 6 local craft beers with tasting notes from the brewers themselves.',
    placeId: 'p2',
    date: '2025-01-31',
    startTime: '17:00',
    endTime: '19:00',
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600',
    category: 'food',
    attendeeIds: ['u1', 'u2', 'u3', 'u5', 'u4'],
  },
  {
    id: 'e4',
    title: 'Te Papa After Dark',
    description: 'Explore the museum after hours with special exhibits, drinks, and DJ sets.',
    placeId: 'p3',
    date: '2025-02-01',
    startTime: '18:00',
    endTime: '22:00',
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600',
    category: 'art',
    attendeeIds: ['u3', 'u1', 'u5'],
  },
  {
    id: 'e5',
    title: 'Sunday Farmers Market',
    description: 'Fresh local produce, artisan goods, and street food from Wellington vendors.',
    placeId: 'p6',
    date: '2025-02-02',
    startTime: '09:00',
    endTime: '13:00',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
    category: 'market',
    attendeeIds: ['u1', 'u3', 'u2', 'u4', 'u5'],
  },
  {
    id: 'e6',
    title: 'Latte Art Throwdown',
    description: 'Watch Wellington\'s best baristas compete in latte art. Free entry, coffee available.',
    placeId: 'p9',
    date: '2025-02-03',
    startTime: '14:00',
    endTime: '17:00',
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600',
    category: 'food',
    attendeeIds: ['u5', 'u1'],
  },
  {
    id: 'e7',
    title: 'Acoustic Sessions',
    description: 'Intimate acoustic performances from local singer-songwriters.',
    placeId: 'p1',
    date: '2025-02-04',
    startTime: '19:00',
    endTime: '21:30',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    category: 'music',
    attendeeIds: ['u3', 'u4'],
  },
  {
    id: 'e8',
    title: 'Pub Quiz Night',
    description: 'Test your knowledge! Teams of up to 6. Prizes for top 3 teams.',
    placeId: 'p10',
    date: '2025-02-05',
    startTime: '19:00',
    endTime: '21:30',
    category: 'community',
    attendeeIds: ['u2', 'u4', 'u1', 'u3'],
  },
];

export function getEventById(id: string): Event | undefined {
  return mockEvents.find((event) => event.id === id);
}

export function getEventsByPlaceId(placeId: string): Event[] {
  return mockEvents.filter((event) => event.placeId === placeId);
}

export function getUpcomingEvents(): Event[] {
  return [...mockEvents].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
