import { describe, expect, it } from 'vitest';
import { averageStars, buildCellar, filterCellar, sortCellar } from './cellar';
import type { Rating, Stars, Wine } from './types';

let counter = 0;
export function wine(partial: Partial<Wine> & { name: string }): Wine {
  counter += 1;
  return {
    id: partial.id ?? `w${counter}`,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...partial,
  };
}
export function rating(
  wineId: string,
  stars: Stars,
  tastedOn: string,
  extra: Partial<Rating> = {},
): Rating {
  counter += 1;
  return {
    id: `r${counter}`,
    wineId,
    stars,
    tastedOn,
    createdAt: `${tastedOn}T12:00:00.000Z`,
    updatedAt: `${tastedOn}T12:00:00.000Z`,
    ...extra,
  };
}

describe('averageStars', () => {
  it('is undefined with no tastings, never zero', () => {
    expect(averageStars([])).toBeUndefined();
  });

  it('is the value itself for one tasting', () => {
    expect(averageStars([{ stars: 4 }])).toBe(4);
  });

  it('is the mean of several tastings', () => {
    expect(averageStars([{ stars: 5 }, { stars: 4 }])).toBe(4.5);
    expect(averageStars([{ stars: 5 }, { stars: 4 }, { stars: 4 }])).toBeCloseTo(4.3333, 4);
    expect(averageStars([{ stars: 1 }, { stars: 5 }])).toBe(3);
  });

  it('stays within 1 to 5', () => {
    expect(averageStars(Array.from({ length: 50 }, () => ({ stars: 5 as const })))).toBe(5);
    expect(averageStars(Array.from({ length: 50 }, () => ({ stars: 1 as const })))).toBe(1);
  });
});

describe('buildCellar', () => {
  it('attaches tastings to their wine, newest first, with latest and average', () => {
    const a = wine({ id: 'a', name: 'A' });
    const b = wine({ id: 'b', name: 'B' });
    const entries = buildCellar(
      [a, b],
      [rating('a', 3, '2025-01-10'), rating('a', 5, '2025-03-01'), rating('zzz', 1, '2025-01-01')],
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]?.ratings.map((r) => r.tastedOn)).toEqual(['2025-03-01', '2025-01-10']);
    expect(entries[0]?.latest?.stars).toBe(5);
    expect(entries[0]?.average).toBe(4);
    expect(entries[1]).toMatchObject({ ratings: [], latest: undefined, average: undefined });
  });

  it('orders two tastings on the same day by creation time', () => {
    const a = wine({ id: 'a', name: 'A' });
    const first = rating('a', 2, '2025-03-01', { createdAt: '2025-03-01T10:00:00.000Z' });
    const second = rating('a', 4, '2025-03-01', { createdAt: '2025-03-01T20:00:00.000Z' });
    expect(buildCellar([a], [first, second])[0]?.latest).toBe(second);
  });
});

describe('sortCellar and filterCellar', () => {
  const entries = buildCellar(
    [
      wine({ id: 'a', name: 'Zinfandel', type: 'red' }),
      wine({ id: 'b', name: 'albariño', type: 'white' }),
      wine({ id: 'c', name: 'Chablis', type: 'white' }),
      wine({ id: 'd', name: 'Unrated', createdAt: '2024-01-01T00:00:00.000Z' }),
    ],
    [
      rating('a', 3, '2025-05-01'),
      rating('b', 5, '2025-02-01'),
      rating('c', 4, '2025-06-01'),
      rating('c', 5, '2025-01-01'),
    ],
  );
  const names = (list: typeof entries) => list.map((e) => e.wine.name);

  it('sorts by most recent tasting', () => {
    expect(names(sortCellar(entries, 'recent'))).toEqual([
      'Chablis',
      'Zinfandel',
      'albariño',
      'Unrated',
    ]);
  });

  it('sorts by average rating, unrated last', () => {
    expect(names(sortCellar(entries, 'rating'))).toEqual([
      'albariño',
      'Chablis',
      'Zinfandel',
      'Unrated',
    ]);
  });

  it('sorts by name ignoring case and accents', () => {
    expect(names(sortCellar(entries, 'name'))).toEqual([
      'albariño',
      'Chablis',
      'Unrated',
      'Zinfandel',
    ]);
  });

  it('does not change the list it was given', () => {
    const before = names(entries);
    sortCellar(entries, 'name');
    expect(names(entries)).toEqual(before);
  });

  it('filters by wine type', () => {
    expect(names(filterCellar(entries, { type: 'white' })).sort()).toEqual(['Chablis', 'albariño']);
    expect(filterCellar(entries, { type: 'dessert' })).toEqual([]);
    expect(filterCellar(entries, {})).toHaveLength(4);
  });
});
