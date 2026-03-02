import { getLevelForPoints, getPointsToNextLevel, LEVEL_DEFINITIONS, POINT_VALUES } from '../../data/achievementDefinitions';

describe('getLevelForPoints', () => {
  it('returns level 1 for 0 points', () => {
    expect(getLevelForPoints(0).level).toBe(1);
    expect(getLevelForPoints(0).title).toBe('Fresh Arrival');
  });

  it('returns level 2 at 50 points', () => {
    expect(getLevelForPoints(50).level).toBe(2);
  });

  it('returns level 10 at 10000 points', () => {
    expect(getLevelForPoints(10000).level).toBe(10);
    expect(getLevelForPoints(10000).title).toBe('Te Whanganui-a-Tara Master');
  });

  it('returns level 10 for points above 10000', () => {
    expect(getLevelForPoints(99999).level).toBe(10);
  });

  it('stays at level 1 for 49 points', () => {
    expect(getLevelForPoints(49).level).toBe(1);
  });

  it('returns correct level at each boundary', () => {
    const boundaries = [0, 50, 150, 350, 700, 1200, 2000, 3500, 6000, 10000];
    boundaries.forEach((pts, index) => {
      expect(getLevelForPoints(pts).level).toBe(index + 1);
    });
  });
});

describe('getPointsToNextLevel', () => {
  it('returns correct next level from level 1', () => {
    const result = getPointsToNextLevel(0);
    expect(result.next?.level).toBe(2);
    expect(result.pointsNeeded).toBe(50);
    expect(result.progress).toBe(0);
  });

  it('returns progress midway through a level', () => {
    const result = getPointsToNextLevel(25);
    expect(result.next?.level).toBe(2);
    expect(result.pointsNeeded).toBe(25);
    expect(result.progress).toBe(0.5);
  });

  it('returns null next at max level', () => {
    const result = getPointsToNextLevel(10000);
    expect(result.next).toBeNull();
    expect(result.progress).toBe(1);
  });
});

describe('POINT_VALUES', () => {
  it('has all expected action types', () => {
    expect(POINT_VALUES.post_photo).toBe(15);
    expect(POINT_VALUES.post_text).toBe(10);
    expect(POINT_VALUES.like_received).toBe(2);
    expect(POINT_VALUES.comment).toBe(5);
    expect(POINT_VALUES.follow).toBe(3);
    expect(POINT_VALUES.event_attend).toBe(10);
    expect(POINT_VALUES.first_discover).toBe(25);
    expect(POINT_VALUES.event_create).toBe(20);
  });

  it('does not include explore action', () => {
    expect('explore' in POINT_VALUES).toBe(false);
  });
});

describe('LEVEL_DEFINITIONS', () => {
  it('has 10 levels', () => {
    expect(LEVEL_DEFINITIONS).toHaveLength(10);
  });

  it('starts at 0 points required', () => {
    expect(LEVEL_DEFINITIONS[0].pointsRequired).toBe(0);
  });

  it('ends at 10000 points required', () => {
    expect(LEVEL_DEFINITIONS[9].pointsRequired).toBe(10000);
  });

  it('has monotonically increasing point requirements', () => {
    for (let i = 1; i < LEVEL_DEFINITIONS.length; i++) {
      expect(LEVEL_DEFINITIONS[i].pointsRequired).toBeGreaterThan(
        LEVEL_DEFINITIONS[i - 1].pointsRequired
      );
    }
  });
});
