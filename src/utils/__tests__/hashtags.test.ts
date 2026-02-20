import { extractHashtags, parseTextWithHashtags } from '../hashtags';

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
