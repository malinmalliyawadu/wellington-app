export type ProfileVisibility = 'public' | 'private';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  onboardingCompleted?: boolean;
  profileVisibility?: ProfileVisibility;
  instagramUsername?: string;
  tiktokUsername?: string;
  xUsername?: string;
}
