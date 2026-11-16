import { describe, expect, it } from 'vitest';
import { formatDate, formatMonth, isIsoDate, todayIso } from './dates';

describe('dates', () => {
  it('formats today in local time, zero-padded', () => {
    expect(todayIso(new Date(2025, 0, 5, 23, 59))).toBe('2025-01-05');
    expect(todayIso(new Date(2025, 11, 31, 0, 0))).toBe('2025-12-31');
  });

  it.each([
    ['2024-02-29', true],
    ['2025-02-29', false],
    ['2025-13-01', false],
    ['2025-04-31', false],
    ['2025-4-1', false],
    ['', false],
  ])('isIsoDate(%s) is %s', (value, expected) => {
    expect(isIsoDate(value)).toBe(expected);
  });

  it('formats dates and months for display', () => {
    expect(formatDate('2025-03-14')).toBe('14 March 2025');
    expect(formatDate('2025-03-14', 'short')).toBe('14 Mar 2025');
    expect(formatMonth('2025-03-14')).toBe('March 2025');
    expect(formatMonth('2024-12')).toBe('December 2024');
    expect(formatDate('garbage')).toBe('garbage');
  });
});
