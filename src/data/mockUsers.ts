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
  {
    id: 'u6',
    username: 'wellygigs',
    displayName: 'Welly Gig Guide',
    avatarUrl: 'https://i.pravatar.cc/150?u=wellygigs',
    bio: 'Your guide to live music in Wellington. Gigs every night.',
  },
  {
    id: 'u7',
    username: 'emilyruns',
    displayName: 'Emily Parker',
    avatarUrl: 'https://i.pravatar.cc/150?u=emilyruns',
    bio: 'Trail runner, brunch enthusiast, Wellington local',
  },
  {
    id: 'u8',
    username: 'jameseats',
    displayName: 'James Wu',
    avatarUrl: 'https://i.pravatar.cc/150?u=jameseats',
    bio: 'Wellington restaurant reviews. Honest opinions only.',
  },
  {
    id: 'u9',
    username: 'livemusicnz',
    displayName: 'Live Music NZ',
    avatarUrl: 'https://i.pravatar.cc/150?u=livemusicnz',
    bio: 'Covering the Aotearoa music scene from the capital',
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getOtherUsers(): User[] {
  return mockUsers.filter((user) => user.id !== currentUser.id);
}
