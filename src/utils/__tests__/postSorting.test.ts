import { sortPosts } from '../postSorting';
import { Post } from '../../types';

function makePost(createdAt: string, overrides: Partial<Post> = {}): Post {
  return {
    id: '1',
    userId: 'user-1',
    placeId: 'place-1',
    type: 'photo',
    content: 'test',
    likes: 0,
    createdAt,
    ...overrides,
  } as Post;
}

describe('sortPosts', () => {
  it('returns empty array for empty input', () => {
    expect(sortPosts([])).toEqual([]);
  });

  it('sorts posts by most recent first', () => {
    const posts = [
      makePost('2024-01-01T00:00:00Z', { id: 'oldest' }),
      makePost('2024-06-15T00:00:00Z', { id: 'middle' }),
      makePost('2024-12-31T00:00:00Z', { id: 'newest' }),
    ];

    const sorted = sortPosts(posts);
    expect(sorted.map((p) => p.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('does not mutate the original array', () => {
    const posts = [
      makePost('2024-12-01T00:00:00Z', { id: 'a' }),
      makePost('2024-01-01T00:00:00Z', { id: 'b' }),
    ];

    const original = [...posts];
    sortPosts(posts);
    expect(posts).toEqual(original);
  });
});
