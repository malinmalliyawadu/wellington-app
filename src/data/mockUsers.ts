import { User } from '../types';

export const currentUser: User = {
  id: 'current',
  username: 'you',
  displayName: 'You',
  avatarUrl: 'https://i.pravatar.cc/150?u=current',
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'u1',
    username: 'wellyfoodies',
    displayName: 'Wellington Foodies',
    avatarUrl: 'https://i.pravatar.cc/150?u=wellyfoodies',
  },
  {
    id: 'u2',
    username: 'craftbeernz',
    displayName: 'Craft Beer NZ',
    avatarUrl: 'https://i.pravatar.cc/150?u=craftbeernz',
  },
  {
    id: 'u3',
    username: 'sarahexplores',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarahexplores',
  },
  {
    id: 'u4',
    username: 'mikelocal',
    displayName: 'Mike Thompson',
    avatarUrl: 'https://i.pravatar.cc/150?u=mikelocal',
  },
  {
    id: 'u5',
    username: 'coffeewelly',
    displayName: 'Coffee Wellington',
    avatarUrl: 'https://i.pravatar.cc/150?u=coffeewelly',
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}
