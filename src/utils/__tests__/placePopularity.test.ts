import {
  computePlacePopularity,
  getMarkerSize,
  getMarkerSizeWithRange,
  getMarkerSizeRange,
  isFollowedPlace,
  isFollowedPlaceSet,
} from '../placePopularity';
import { Post } from '../../types';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: '1',
    userId: 'user-1',
    placeId: 'place-1',
    type: 'photo',
    content: 'Great spot',
    likes: 5,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  } as Post;
}

describe('computePlacePopularity', () => {
  it('returns empty map for no posts', () => {
    const result = computePlacePopularity([]);
    expect(result.size).toBe(0);
  });

  it('computes popularity for a single post', () => {
    const posts = [makePost({ placeId: 'p1', likes: 10 })];
    const result = computePlacePopularity(posts);

    expect(result.size).toBe(1);
    const p = result.get('p1')!;
    expect(p.postCount).toBe(1);
    expect(p.totalLikes).toBe(10);
    expect(p.score).toBe(11); // 1 post + 10 likes
  });

  it('aggregates multiple posts for the same place', () => {
    const posts = [
      makePost({ id: '1', placeId: 'p1', userId: 'u1', likes: 5 }),
      makePost({ id: '2', placeId: 'p1', userId: 'u2', likes: 3 }),
      makePost({ id: '3', placeId: 'p1', userId: 'u1', likes: 2 }),
    ];
    const result = computePlacePopularity(posts);

    const p = result.get('p1')!;
    expect(p.postCount).toBe(3);
    expect(p.totalLikes).toBe(10);
    expect(p.score).toBe(13);
    expect(p.posterIds).toEqual(['u1', 'u2']); // no duplicates
  });

  it('separates different places', () => {
    const posts = [
      makePost({ id: '1', placeId: 'p1', likes: 5 }),
      makePost({ id: '2', placeId: 'p2', likes: 3 }),
    ];
    const result = computePlacePopularity(posts);
    expect(result.size).toBe(2);
    expect(result.get('p1')!.score).toBe(6);
    expect(result.get('p2')!.score).toBe(4);
  });
});

describe('getMarkerSize', () => {
  it('returns midpoint when all scores are equal', () => {
    const map = new Map([
      ['p1', { placeId: 'p1', postCount: 1, totalLikes: 5, score: 6, posterIds: [] }],
    ]);
    expect(getMarkerSize(6, map)).toBe((28 + 96) / 2);
  });

  it('returns min size for lowest score', () => {
    const map = new Map([
      ['p1', { placeId: 'p1', postCount: 1, totalLikes: 0, score: 1, posterIds: [] }],
      ['p2', { placeId: 'p2', postCount: 5, totalLikes: 10, score: 15, posterIds: [] }],
    ]);
    expect(getMarkerSize(1, map)).toBe(28);
  });

  it('returns max size for highest score', () => {
    const map = new Map([
      ['p1', { placeId: 'p1', postCount: 1, totalLikes: 0, score: 1, posterIds: [] }],
      ['p2', { placeId: 'p2', postCount: 5, totalLikes: 10, score: 15, posterIds: [] }],
    ]);
    expect(getMarkerSize(15, map)).toBe(96);
  });
});

describe('getMarkerSizeRange', () => {
  it('computes min and max scores', () => {
    const map = new Map([
      ['p1', { placeId: 'p1', postCount: 1, totalLikes: 0, score: 2, posterIds: [] }],
      ['p2', { placeId: 'p2', postCount: 3, totalLikes: 5, score: 8, posterIds: [] }],
      ['p3', { placeId: 'p3', postCount: 2, totalLikes: 3, score: 5, posterIds: [] }],
    ]);
    const range = getMarkerSizeRange(map);
    expect(range.minScore).toBe(2);
    expect(range.maxScore).toBe(8);
  });
});

describe('getMarkerSizeWithRange', () => {
  it('returns midpoint for equal min and max', () => {
    expect(getMarkerSizeWithRange(5, { minScore: 5, maxScore: 5 })).toBe((28 + 96) / 2);
  });

  it('interpolates correctly', () => {
    const range = { minScore: 0, maxScore: 10 };
    expect(getMarkerSizeWithRange(0, range)).toBe(28);
    expect(getMarkerSizeWithRange(10, range)).toBe(96);
    expect(getMarkerSizeWithRange(5, range)).toBe(62); // midpoint
  });
});

describe('isFollowedPlace', () => {
  it('returns true when a poster is followed', () => {
    expect(isFollowedPlace(['u1', 'u2'], ['u2', 'u3'])).toBe(true);
  });

  it('returns false when no poster is followed', () => {
    expect(isFollowedPlace(['u1', 'u2'], ['u3', 'u4'])).toBe(false);
  });

  it('returns false for empty arrays', () => {
    expect(isFollowedPlace([], ['u1'])).toBe(false);
    expect(isFollowedPlace(['u1'], [])).toBe(false);
  });
});

describe('isFollowedPlaceSet', () => {
  it('returns true when a poster is in the set', () => {
    expect(isFollowedPlaceSet(['u1', 'u2'], new Set(['u2', 'u3']))).toBe(true);
  });

  it('returns false when no poster is in the set', () => {
    expect(isFollowedPlaceSet(['u1'], new Set(['u3']))).toBe(false);
  });
});
