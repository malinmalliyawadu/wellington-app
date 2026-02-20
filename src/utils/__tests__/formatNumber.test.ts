import { formatNumber } from '../formatNumber';

describe('formatNumber', () => {
  it('returns empty string for undefined', () => {
    expect(formatNumber(undefined)).toBe('');
  });

  it('returns number as-is below 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(formatNumber(1000)).toBe('1k');
    expect(formatNumber(1427)).toBe('1.4k');
    expect(formatNumber(25582)).toBe('25.6k');
    expect(formatNumber(999999)).toBe('1000k');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1M');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(12345678)).toBe('12.3M');
  });

  it('drops trailing .0', () => {
    expect(formatNumber(1000)).toBe('1k');
    expect(formatNumber(2000000)).toBe('2M');
  });
});
