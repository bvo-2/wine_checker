import { groupKey, type GroupField } from './grouping';
import type { Rating, Wine, WineType } from './types';

/** A wine together with my tastings of it. */
export interface CellarEntry {
  wine: Wine;
  /** Newest first. */
  ratings: Rating[];
  latest?: Rating;
  /** Mean of the stars, unrounded. Undefined when there are no tastings. */
  average?: number;
}

/** Mean of the stars. Undefined for an empty list, so "no rating" is never shown as 0. */
export function averageStars(ratings: readonly Pick<Rating, 'stars'>[]): number | undefined {
  if (ratings.length === 0) return undefined;
  return ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
}

/** Newest tasting first; ties broken by when the record was created. */
export function byNewestTasting(a: Rating, b: Rating): number {
  return b.tastedOn.localeCompare(a.tastedOn) || b.createdAt.localeCompare(a.createdAt);
}

export function buildCellar(wines: readonly Wine[], ratings: readonly Rating[]): CellarEntry[] {
  const byWine = new Map<string, Rating[]>();
  for (const rating of ratings) {
    const list = byWine.get(rating.wineId);
    if (list) list.push(rating);
    else byWine.set(rating.wineId, [rating]);
  }
  return wines.map((wine) => {
    const own = (byWine.get(wine.id) ?? []).sort(byNewestTasting);
    return { wine, ratings: own, latest: own[0], average: averageStars(own) };
  });
}

export const CELLAR_SORTS = ['recent', 'rating', 'name'] as const;
export type CellarSort = (typeof CELLAR_SORTS)[number];

function byName(a: CellarEntry, b: CellarEntry): number {
  return (
    a.wine.name.localeCompare(b.wine.name, 'en', { sensitivity: 'base' }) ||
    (b.wine.vintage ?? 0) - (a.wine.vintage ?? 0)
  );
}

/** The moment a wine was last "touched": its latest tasting, else when it was added. */
function recency(entry: CellarEntry): string {
  return entry.latest
    ? `${entry.latest.tastedOn}|${entry.latest.createdAt}`
    : entry.wine.createdAt.slice(0, 10);
}

export function sortCellar(entries: readonly CellarEntry[], sort: CellarSort): CellarEntry[] {
  const list = [...entries];
  switch (sort) {
    case 'recent':
      return list.sort((a, b) => recency(b).localeCompare(recency(a)) || byName(a, b));
    case 'rating':
      // Unrated wines go last.
      return list.sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || byName(a, b));
    case 'name':
      return list.sort(byName);
  }
}

export interface CellarFilter {
  type?: WineType;
  /** Only the wines of one winery, region or country (see grouping.ts). */
  group?: { field: GroupField; key: string };
}

export function filterCellar(entries: readonly CellarEntry[], filter: CellarFilter): CellarEntry[] {
  const { type, group } = filter;
  return entries.filter(
    (entry) =>
      (!type || entry.wine.type === type) &&
      (!group || groupKey(entry.wine, group.field) === group.key),
  );
}
