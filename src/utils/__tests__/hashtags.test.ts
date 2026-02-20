import { extractHashtags, parseTextWithHashtags, placeNameToHashtag, detectHashtagAtCursor } from '../hashtags';

describe('extractHashtags', () => {
  it('returns empty array for text without hashtags', () => {
    expect(extractHashtags('no hashtags here')).toEqual([]);
  });

  it('extracts a single hashtag', () => {
    expect(extractHashtags('Love this #cafe')).toEqual(['cafe']);
  });

  it('extracts multiple hashtags', () => {
    expect(extractHashtags('#brunch at the best #cafe in #wellington')).toEqual([
      'brunch',
      'cafe',
      'wellington',
    ]);
  });

  it('returns unique lowercase tags', () => {
    expect(extractHashtags('#Coffee #coffee #COFFEE')).toEqual(['coffee']);
  });

  it('handles underscores in tags', () => {
    expect(extractHashtags('#happy_hour')).toEqual(['happy_hour']);
  });

  it('handles numbers in tags', () => {
    expect(extractHashtags('#top10 #best2026')).toEqual(['top10', 'best2026']);
  });

  it('ignores tags longer than 30 characters', () => {
    const longTag = '#' + 'a'.repeat(31);
    expect(extractHashtags(longTag)).toEqual([]);
  });

  it('accepts tags exactly 30 characters', () => {
    const tag = 'a'.repeat(30);
    expect(extractHashtags('#' + tag)).toEqual([tag]);
  });

  it('handles hashtags at beginning, middle, and end', () => {
    expect(extractHashtags('#start middle #mid end #finish')).toEqual([
      'start',
      'mid',
      'finish',
    ]);
  });

  it('handles empty string', () => {
    expect(extractHashtags('')).toEqual([]);
  });

  it('ignores standalone # without word', () => {
    expect(extractHashtags('# not a tag')).toEqual([]);
  });
});

describe('parseTextWithHashtags', () => {
  it('returns single text segment for plain text', () => {
    expect(parseTextWithHashtags('no hashtags')).toEqual([
      { type: 'text', value: 'no hashtags' },
    ]);
  });

  it('splits text and hashtag', () => {
    expect(parseTextWithHashtags('Love this #cafe!')).toEqual([
      { type: 'text', value: 'Love this ' },
      { type: 'hashtag', value: 'cafe' },
      { type: 'text', value: '!' },
    ]);
  });

  it('handles hashtag at start', () => {
    expect(parseTextWithHashtags('#brunch is great')).toEqual([
      { type: 'hashtag', value: 'brunch' },
      { type: 'text', value: ' is great' },
    ]);
  });

  it('handles hashtag at end', () => {
    expect(parseTextWithHashtags('great #food')).toEqual([
      { type: 'text', value: 'great ' },
      { type: 'hashtag', value: 'food' },
    ]);
  });

  it('handles multiple hashtags', () => {
    expect(parseTextWithHashtags('#coffee and #cake')).toEqual([
      { type: 'hashtag', value: 'coffee' },
      { type: 'text', value: ' and ' },
      { type: 'hashtag', value: 'cake' },
    ]);
  });

  it('handles empty string', () => {
    expect(parseTextWithHashtags('')).toEqual([]);
  });

  it('preserves hashtag value without # prefix', () => {
    const result = parseTextWithHashtags('#Wellington');
    expect(result[0]).toEqual({ type: 'hashtag', value: 'Wellington' });
  });
});

describe('placeNameToHashtag', () => {
  it('converts simple name to lowercase', () => {
    expect(placeNameToHashtag('Havana')).toBe('havana');
  });

  it('strips spaces and special characters', () => {
    expect(placeNameToHashtag("Fidel's Cafe")).toBe('fidelscafe');
  });

  it('strips ampersands and punctuation', () => {
    expect(placeNameToHashtag('Fork & Brewer')).toBe('forkbrewer');
  });

  it('truncates to 30 characters', () => {
    const longName = 'A'.repeat(40);
    expect(placeNameToHashtag(longName)).toBe('a'.repeat(30));
  });

  it('returns null for empty result', () => {
    expect(placeNameToHashtag('!@#$%')).toBeNull();
  });

  it('handles numbers in name', () => {
    expect(placeNameToHashtag('Cafe 42')).toBe('cafe42');
  });

  it('returns null for empty string', () => {
    expect(placeNameToHashtag('')).toBeNull();
  });
});

describe('detectHashtagAtCursor', () => {
  it('detects partial hashtag at cursor', () => {
    expect(detectHashtagAtCursor('Love this #cof', 14)).toBe('cof');
  });

  it('detects full word hashtag at cursor', () => {
    expect(detectHashtagAtCursor('#coffee', 7)).toBe('coffee');
  });

  it('returns null when cursor is not in a hashtag', () => {
    expect(detectHashtagAtCursor('no hashtag here', 5)).toBeNull();
  });

  it('returns null for cursor at position 0', () => {
    expect(detectHashtagAtCursor('#test', 0)).toBeNull();
  });

  it('returns null when # has no following characters', () => {
    expect(detectHashtagAtCursor('text #', 6)).toBeNull();
  });

  it('detects hashtag in middle of text', () => {
    expect(detectHashtagAtCursor('Check out #flat white', 15)).toBe('flat');
  });

  it('returns null when cursor is after a space', () => {
    expect(detectHashtagAtCursor('#coffee is great', 9)).toBeNull();
  });

  it('handles cursor beyond text length', () => {
    expect(detectHashtagAtCursor('short', 100)).toBeNull();
  });

  it('detects hashtag with numbers', () => {
    expect(detectHashtagAtCursor('#top1', 5)).toBe('top1');
  });

  it('detects hashtag with underscores', () => {
    expect(detectHashtagAtCursor('#happy_h', 8)).toBe('happy_h');
  });
});
