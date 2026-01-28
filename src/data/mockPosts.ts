import { Post } from '../types';

export const mockPosts: Post[] = [
  {
    id: 'post1',
    userId: 'u1',
    placeId: 'p1',
    type: 'photo',
    content: "Best eggs benedict in Wellington. Fidel's never disappoints!",
    mediaUrl: 'https://images.unsplash.com/photo-1608039829572-f85225e9696d?w=600',
    createdAt: '2025-01-28T09:30:00Z',
  },
  {
    id: 'post2',
    userId: 'u2',
    placeId: 'p2',
    type: 'photo',
    content: 'Incredible selection of local craft beers on tap. The Garage Project Hāpi Daze is perfect for summer.',
    mediaUrl: 'https://images.unsplash.com/photo-1575037614876-c38a4c44d726?w=600',
    createdAt: '2025-01-27T18:45:00Z',
  },
  {
    id: 'post3',
    userId: 'u3',
    placeId: 'p3',
    type: 'photo',
    content: 'Spent the whole afternoon here. The Gallipoli exhibition is incredibly moving. Free entry!',
    mediaUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600',
    createdAt: '2025-01-27T15:20:00Z',
  },
  {
    id: 'post4',
    userId: 'u4',
    placeId: 'p4',
    type: 'photo',
    content: "Classic Wellington experience. The views from the top are unreal, especially at sunset.",
    mediaUrl: 'https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?w=600',
    createdAt: '2025-01-26T17:00:00Z',
  },
  {
    id: 'post5',
    userId: 'u5',
    placeId: 'p9',
    type: 'photo',
    content: 'Havana roasts some of the best beans in the city. Love watching the roasting process.',
    mediaUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    createdAt: '2025-01-26T08:15:00Z',
  },
  {
    id: 'post6',
    userId: 'u1',
    placeId: 'p5',
    type: 'photo',
    content: 'Sunday brunch done right. The ricotta hotcakes are heavenly.',
    mediaUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
    createdAt: '2025-01-25T11:30:00Z',
  },
  {
    id: 'post7',
    userId: 'u3',
    placeId: 'p6',
    type: 'photo',
    content: 'Perfect day for a walk through the gardens. The rose garden is in full bloom!',
    mediaUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600',
    createdAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'post8',
    userId: 'u4',
    placeId: 'p7',
    type: 'text',
    content: 'Caught an amazing live show here last night. The sound is always great at San Fran.',
    createdAt: '2025-01-24T23:30:00Z',
  },
  {
    id: 'post9',
    userId: 'u5',
    placeId: 'p8',
    type: 'photo',
    content: 'Prefab is my go-to for work meetings. Great coffee, great food, great vibes.',
    mediaUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600',
    createdAt: '2025-01-24T10:00:00Z',
  },
  {
    id: 'post10',
    userId: 'u2',
    placeId: 'p10',
    type: 'photo',
    content: 'Hidden gem! Tucked away but worth finding. Great Belgian beer selection.',
    mediaUrl: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600',
    createdAt: '2025-01-23T19:00:00Z',
  },
  {
    id: 'post11',
    userId: 'u1',
    placeId: 'p2',
    type: 'text',
    content: "Just discovered they have an amazing vegan menu now. Golding's keeps getting better!",
    createdAt: '2025-01-23T20:15:00Z',
  },
  {
    id: 'post12',
    userId: 'u3',
    placeId: 'p1',
    type: 'photo',
    content: 'Revolutionary vibes and revolutionary coffee. Cuba Street institution.',
    mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
    createdAt: '2025-01-22T09:00:00Z',
  },
];

export function getPostsByPlaceId(placeId: string): Post[] {
  return mockPosts.filter((post) => post.placeId === placeId);
}

export function getPostsByUserId(userId: string): Post[] {
  return mockPosts.filter((post) => post.userId === userId);
}
