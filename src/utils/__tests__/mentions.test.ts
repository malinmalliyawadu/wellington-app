import { extractMentions, detectMentionAtCursor } from '../mentions';

describe('extractMentions', () => {
  it('returns empty array for text without mentions', () => {
    expect(extractMentions('no mentions here')).toEqual([]);
  });

  it('extracts a single mention', () => {
    expect(extractMentions('Hey @alice check this out')).toEqual(['alice']);
  });

  it('extracts multiple mentions', () => {
    expect(extractMentions('@alice and @bob went to @charlies_cafe')).toEqual([
      'alice',
      'bob',
      'charlies_cafe',
    ]);
  });

  it('returns unique lowercase usernames', () => {
    expect(extractMentions('@Alice @alice @ALICE')).toEqual(['alice']);
  });

  it('handles mention at start of text', () => {
    expect(extractMentions('@alice is great')).toEqual(['alice']);
  });

  it('handles mention at end of text', () => {
    expect(extractMentions('Great post @alice')).toEqual(['alice']);
  });

  it('ignores email addresses', () => {
    expect(extractMentions('Email me at user@gmail.com')).toEqual([]);
  });

  it('handles mixed mentions and emails', () => {
    expect(extractMentions('@alice email user@gmail.com and @bob')).toEqual([
      'alice',
      'bob',
    ]);
  });

  it('handles underscores in usernames', () => {
    expect(extractMentions('@cool_user_123')).toEqual(['cool_user_123']);
  });

  it('handles numbers in usernames', () => {
    expect(extractMentions('@user42')).toEqual(['user42']);
  });

  it('ignores mentions longer than 30 characters', () => {
    const longUsername = '@' + 'a'.repeat(31);
    expect(extractMentions(longUsername)).toEqual([]);
  });

  it('accepts mentions exactly 30 characters', () => {
    const username = 'a'.repeat(30);
    expect(extractMentions('@' + username)).toEqual([username]);
  });

  it('handles empty string', () => {
    expect(extractMentions('')).toEqual([]);
  });

  it('ignores standalone @ without word', () => {
    expect(extractMentions('@ not a mention')).toEqual([]);
  });

  it('handles mentions with hashtags', () => {
    expect(extractMentions('@alice loves #coffee at @bobs_cafe')).toEqual([
      'alice',
      'bobs_cafe',
    ]);
  });

  it('handles newline before mention', () => {
    expect(extractMentions('Hello\n@alice')).toEqual(['alice']);
  });
});

describe('detectMentionAtCursor', () => {
  it('detects partial mention at cursor', () => {
    expect(detectMentionAtCursor('Hey @ali', 8)).toBe('ali');
  });

  it('detects full word mention at cursor', () => {
    expect(detectMentionAtCursor('@alice', 6)).toBe('alice');
  });

  it('returns null when cursor is not in a mention', () => {
    expect(detectMentionAtCursor('no mention here', 5)).toBeNull();
  });

  it('returns null for cursor at position 0', () => {
    expect(detectMentionAtCursor('@test', 0)).toBeNull();
  });

  it('returns null when @ has no following characters', () => {
    expect(detectMentionAtCursor('text @', 6)).toBeNull();
  });

  it('detects mention in middle of text', () => {
    expect(detectMentionAtCursor('Hey @ali is here', 8)).toBe('ali');
  });

  it('returns null when cursor is after a space', () => {
    expect(detectMentionAtCursor('@alice is great', 9)).toBeNull();
  });

  it('handles cursor beyond text length', () => {
    expect(detectMentionAtCursor('short', 100)).toBeNull();
  });

  it('detects mention with numbers', () => {
    expect(detectMentionAtCursor('@user1', 6)).toBe('user1');
  });

  it('detects mention with underscores', () => {
    expect(detectMentionAtCursor('@cool_u', 7)).toBe('cool_u');
  });

  it('rejects email-like patterns', () => {
    expect(detectMentionAtCursor('user@gma', 8)).toBeNull();
  });

  it('detects mention after newline', () => {
    expect(detectMentionAtCursor('Hello\n@ali', 10)).toBe('ali');
  });
});
