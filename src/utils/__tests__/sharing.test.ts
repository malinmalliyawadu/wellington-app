import { getPostUrl, getPlaceUrl, getEventUrl, getUserUrl } from '../sharing';

describe('URL generators', () => {
  it('generates post URLs', () => {
    expect(getPostUrl('abc-123')).toBe('https://welly.nz/post/abc-123');
  });

  it('generates place URLs', () => {
    expect(getPlaceUrl('place-456')).toBe('https://welly.nz/place/place-456');
  });

  it('generates event URLs', () => {
    expect(getEventUrl('event-789')).toBe('https://welly.nz/event/event-789');
  });

  it('generates user URLs', () => {
    expect(getUserUrl('user-321')).toBe('https://welly.nz/user/user-321');
  });
});
