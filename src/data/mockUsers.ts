import { User } from '../types';

export const currentUser: User = {
  id: 'current',
  username: 'you',
  displayName: 'You',
  avatarUrl: 'https://i.pravatar.cc/150?u=current',
  bio: 'Exploring Wellington one spot at a time',
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'u1',
    username: 'wellyfoodies',
    displayName: 'Wellington Foodies',
    avatarUrl: 'https://i.pravatar.cc/150?u=wellyfoodies',
    bio: 'Eating our way through Wellington. DM for collabs!',
  },
  {
    id: 'u2',
    username: 'craftbeernz',
    displayName: 'Craft Beer NZ',
    avatarUrl: 'https://i.pravatar.cc/150?u=craftbeernz',
    bio: 'Reviewing the best craft beer in Aotearoa',
  },
  {
    id: 'u3',
    username: 'sarahexplores',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarahexplores',
    bio: 'Photographer & adventurer based in Welly',
  },
  {
    id: 'u4',
    username: 'mikelocal',
    displayName: 'Mike Thompson',
    avatarUrl: 'https://i.pravatar.cc/150?u=mikelocal',
    bio: 'Live music lover. Always at a gig somewhere.',
  },
  {
    id: 'u5',
    username: 'coffeewelly',
    displayName: 'Coffee Wellington',
    avatarUrl: 'https://i.pravatar.cc/150?u=coffeewelly',
    bio: 'On a mission to find the perfect flat white',
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getOtherUsers(): User[] {
  return mockUsers.filter((user) => user.id !== currentUser.id);
}
