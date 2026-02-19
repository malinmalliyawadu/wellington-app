export interface InstagramConnection {
  id: string;
  userId: string;
  instagramUserId: string;
  instagramUsername: string;
  accessToken: string;
  tokenExpiresAt: string;
  connectedAt: string;
}

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: InstagramMediaType;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramMediaPage {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}
