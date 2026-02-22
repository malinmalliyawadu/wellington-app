import type { Post } from './Post';
import type { User } from './User';
import type { Place } from './Place';
import type { Guide } from './Guide';

export type FeedItem =
  | { type: 'post'; post: Post; user: User; place: Place; sortDate: string }
  | { type: 'guide'; guide: Guide; user: User; sortDate: string };
