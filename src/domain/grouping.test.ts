import { describe, expect, it } from 'vitest';
import { buildCellar, filterCellar } from './cellar';
import { groupCellar, groupKey, groupTastingsByMonth, sortGroups, UNKNOWN_KEY } from './grouping';
import type { Rating, Stars, Wine } from './types';

const stamp = '2025-01-01T00:00:00.000Z';
let n = 0;
const wine = (partial: Partial<Wine> & { id: string }): Wine => ({
  name: partial.id,
  createdAt: stamp,
  updatedAt: stamp,
  ...partial,
});
const rating = (wineId: string, stars: Stars, tastedOn: string): Rating => {
  n += 1;
  return {
    id: `r${n}`,
    wineId,
    stars,
    tastedOn,
    createdAt: `${tastedOn}T10:00:00Z`,
    updatedAt: stamp,
  };
};

const wines = [
  wine({ id: 'a', producer: 'Conterno', region: 'Piedmont', country: 'IT' }),
  wine({ id: 'b', producer: '  conterno ', region: 'Piedmont', country: 'IT' }),
  wine({ id: 'c', producer: 'Raveneau', region: 'Burgundy', country: 'FR' }),
  wine({ id: 'd' }),
  wine({ id: 'e', producer: 'Unrated Estate', country: 'FR' }),
];
const ratings = [
  rating('a', 5, '2025-03-01'),
  rating('a', 4, '2025-03-20'),
  rating('b', 3, '2025-02-10'),
  rating('c', 5, '2024-12-31'),
  rating('d', 2, '2025-03-05'),
];
const entries = buildCellar(wines, ratings);

describe('groupCellar', () => {
  it('groups by producer, merging spellings that differ only in case and spaces', () => {
    const groups = sortGroups(groupCellar(entries, 'producer'), 'name');
    expect(groups).toEqual([
      { key: 'conterno', label: 'Conterno', wineCount: 2, tastingCount: 3, average: 4 },
      { key: 'raveneau', label: 'Raveneau', wineCount: 1, tastingCount: 1, average: 5 },
      {
        key: 'unrated estate',
        label: 'Unrated Estate',
        wineCount: 1,
        tastingCount: 0,
        average: undefined,
      },
      { key: UNKNOWN_KEY, label: 'Unknown', wineCount: 1, tastingCount: 1, average: 2 },
    ]);
  });

  it('picks the same label whatever order the wines are read in', () => {
    const reversed = buildCellar([...wines].reverse(), ratings);
    expect(sortGroups(groupCellar(reversed, 'producer'), 'name')[0]?.label).toBe('Conterno');
    const majority = buildCellar(
      [
        wine({ id: 'x', producer: 'DOMAINE X' }),
        wine({ id: 'y', producer: 'Domaine X' }),
        wine({ id: 'z', producer: 'Domaine X' }),
      ],
      [],
    );
    expect(groupCellar(majority, 'producer')[0]?.label).toBe('Domaine X');
  });

  it('puts wines with no region under Unknown', () => {
    const groups = sortGroups(groupCellar(entries, 'region'), 'name');
    expect(groups.map((g) => [g.label, g.wineCount])).toEqual([
      ['Burgundy', 1],
      ['Piedmont', 2],
      ['Unknown', 2],
    ]);
  });

  it('groups by country and shows country names', () => {
    const groups = sortGroups(groupCellar(entries, 'country'), 'name');
    expect(groups.map((g) => [g.key, g.label, g.wineCount])).toEqual([
      ['FR', 'France', 2],
      ['IT', 'Italy', 2],
      [UNKNOWN_KEY, 'Unknown', 1],
    ]);
  });

  it('averages over tastings, not over wines', () => {
    const italy = groupCellar(entries, 'country').find((g) => g.key === 'IT');
    // 5, 4 and 3: the mean of tastings is 4. A mean of per-wine means would be 3.75.
    expect(italy?.average).toBe(4);
  });

  it('counts every wine exactly once', () => {
    for (const field of ['producer', 'region', 'country'] as const) {
      const total = groupCellar(entries, field).reduce((sum, g) => sum + g.wineCount, 0);
      expect(total).toBe(wines.length);
    }
  });

  it('returns no groups for an empty cellar', () => {
    expect(groupCellar([], 'producer')).toEqual([]);
  });
});

describe('sortGroups', () => {
  it('sorts by rating with unrated groups last, then by name', () => {
    const groups = sortGroups(groupCellar(entries, 'producer'), 'rating');
    expect(groups.map((g) => g.label)).toEqual([
      'Raveneau',
      'Conterno',
      'Unknown',
      'Unrated Estate',
    ]);
  });

  it('keeps Unknown last when sorting by name', () => {
    const groups = sortGroups(groupCellar(entries, 'producer'), 'name');
    expect(groups[groups.length - 1]?.label).toBe('Unknown');
  });
});

describe('filtering the cellar by group', () => {
  it('returns the wines of one group', () => {
    const list = filterCellar(entries, { group: { field: 'producer', key: 'conterno' } });
    expect(list.map((e) => e.wine.id)).toEqual(['a', 'b']);
  });

  it('returns the wines with a missing value for the Unknown group', () => {
    const list = filterCellar(entries, { group: { field: 'region', key: UNKNOWN_KEY } });
    expect(list.map((e) => e.wine.id)).toEqual(['d', 'e']);
  });

  it('agrees with groupCellar for every group', () => {
    for (const field of ['producer', 'region', 'country'] as const) {
      for (const group of groupCellar(entries, field)) {
        const list = filterCellar(entries, { group: { field, key: group.key } });
        expect(list).toHaveLength(group.wineCount);
        for (const entry of list) expect(groupKey(entry.wine, field)).toBe(group.key);
      }
    }
  });
});

describe('groupTastingsByMonth', () => {
  it('lists tastings newest first, grouped by month, with their wine', () => {
    const months = groupTastingsByMonth(wines, ratings);
    expect(months.map((m) => [m.month, m.tastings.map((t) => t.rating.tastedOn)])).toEqual([
      ['2025-03', ['2025-03-20', '2025-03-05', '2025-03-01']],
      ['2025-02', ['2025-02-10']],
      ['2024-12', ['2024-12-31']],
    ]);
    expect(months[0]?.tastings[1]?.wine?.id).toBe('d');
  });

  it('returns nothing when there are no tastings', () => {
    expect(groupTastingsByMonth(wines, [])).toEqual([]);
  });

  it('keeps a tasting whose wine record is missing', () => {
    const months = groupTastingsByMonth([], [rating('ghost', 3, '2025-01-01')]);
    expect(months[0]?.tastings[0]?.wine).toBeUndefined();
  });
});
