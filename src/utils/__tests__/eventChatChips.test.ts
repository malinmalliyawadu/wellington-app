import { getEventChips } from '../eventChatChips';

describe('getEventChips', () => {
  it('returns 4 chips for each category', () => {
    const categories = [
      'music', 'comedy', 'art', 'food', 'market',
      'quiz', 'kids', 'cultural', 'craft', 'community',
    ];
    for (const cat of categories) {
      const chips = getEventChips('Test Event', cat);
      expect(chips).toHaveLength(4);
    }
  });

  it('returns 4 chips for unknown/undefined category', () => {
    expect(getEventChips('Test Event')).toHaveLength(4);
    expect(getEventChips('Test Event', 'unknown')).toHaveLength(4);
  });

  it('includes event title in all questions', () => {
    const title = 'Fat Freddy Drop Live';
    const chips = getEventChips(title, 'music');
    for (const chip of chips) {
      expect(chip.question).toContain(title);
    }
  });

  it('has category-specific first chip for music', () => {
    const chips = getEventChips('Jazz Night', 'music');
    expect(chips[0].label).toBe('About the artist');
  });

  it('has category-specific first chip for comedy', () => {
    const chips = getEventChips('Laugh Fest', 'comedy');
    expect(chips[0].label).toBe('About the comedian');
  });

  it('has category-specific first chip for food', () => {
    const chips = getEventChips('Night Market', 'food');
    expect(chips[0].label).toBe("What's on the menu");
  });

  it('has category-specific first chip for quiz', () => {
    const chips = getEventChips('Pub Quiz', 'quiz');
    expect(chips[0].label).toBe('How it works');
  });

  it('includes common chips (food nearby, getting there) for non-food categories', () => {
    const chips = getEventChips('Test', 'music');
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('Food nearby');
    expect(labels).toContain('Getting there');
  });

  it('food category has Getting there but not Food nearby', () => {
    const chips = getEventChips('Food Fest', 'food');
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('Getting there');
    expect(labels).not.toContain('Food nearby');
  });

  it('every chip has label, emoji, and question', () => {
    const chips = getEventChips('Test', 'art');
    for (const chip of chips) {
      expect(chip.label).toBeTruthy();
      expect(chip.emoji).toBeTruthy();
      expect(chip.question).toBeTruthy();
    }
  });
});
