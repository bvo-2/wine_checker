import { averageStars, byNewestTasting, type CellarEntry } from './cellar';
import { countryName } from './countries';
import { normalizeText } from './duplicates';
import type { Rating, Wine } from './types';

export const GROUP_FIELDS = ['producer', 'region', 'country'] as const;
export type GroupField = (typeof GROUP_FIELDS)[number];

/** Key of the group for wines with no producer / region / country. */
export const UNKNOWN_KEY = '';
export const UNKNOWN_LABEL = 'Unknown';

/** The group a wine belongs to. Spelling differences in case and spacing share a group. */
export function groupKey(wine: Wine, field: GroupField): string {
  return field === 'country' ? (wine.country ?? UNKNOWN_KEY) : normalizeText(wine[field]);
}

export interface WineGroup {
  key: string;
  label: string;
  wineCount: number;
  tastingCount: number;
  /** Mean of every tasting of every wine in the group. Undefined with no tastings. */
  average?: number;
}

function groupLabel(wine: Wine, field: GroupField): string {
  if (groupKey(wine, field) === UNKNOWN_KEY) return UNKNOWN_LABEL;
  if (field === 'country') return countryName(wine.country ?? '');
  return (wine[field] ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * When one group has several spellings ("Conterno", "conterno"), show the most
 * used one; on a tie, the one with more capitals, then alphabetical order. The
 * result must not depend on the order the wines happen to be read in.
 */
function pickLabel(spellings: Map<string, number>): string {
  const capitals = (text: string) => text.replace(/[^\p{Lu}]/gu, '').length;
  return (
    [...spellings].sort(
      ([a, countA], [b, countB]) =>
        countB - countA || capitals(b) - capitals(a) || a.localeCompare(b, 'en'),
    )[0]?.[0] ?? UNKNOWN_LABEL
  );
}

/** Groups my wines by winery, region or country. Wines without the field go under "Unknown". */
export function groupCellar(entries: readonly CellarEntry[], field: GroupField): WineGroup[] {
  const groups = new Map<
    string,
    { spellings: Map<string, number>; wines: number; ratings: Rating[] }
  >();
  for (const entry of entries) {
    const key = groupKey(entry.wine, field);
    const label = groupLabel(entry.wine, field);
    const group = groups.get(key) ?? {
      spellings: new Map<string, number>(),
      wines: 0,
      ratings: [] as Rating[],
    };
    group.spellings.set(label, (group.spellings.get(label) ?? 0) + 1);
    group.wines += 1;
    group.ratings.push(...entry.ratings);
    groups.set(key, group);
  }
  return [...groups].map(([key, group]) => ({
    key,
    label: pickLabel(group.spellings),
    wineCount: group.wines,
    tastingCount: group.ratings.length,
    average: averageStars(group.ratings),
  }));
}

export const GROUP_SORTS = ['name', 'rating'] as const;
export type GroupSort = (typeof GROUP_SORTS)[number];

function byLabel(a: WineGroup, b: WineGroup): number {
  // "Unknown" always goes last.
  if ((a.key === UNKNOWN_KEY) !== (b.key === UNKNOWN_KEY)) return a.key === UNKNOWN_KEY ? 1 : -1;
  return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
}

export function sortGroups(groups: readonly WineGroup[], sort: GroupSort): WineGroup[] {
  const list = [...groups];
  return sort === 'name'
    ? list.sort(byLabel)
    : list.sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || byLabel(a, b));
}

export interface TastingWithWine {
  rating: Rating;
  /** Undefined only if the wine record is missing, which the app never causes. */
  wine?: Wine;
}

export interface TastingMonth {
  /** YYYY-MM */
  month: string;
  tastings: TastingWithWine[];
}

/** Every tasting, newest first, grouped by calendar month. */
export function groupTastingsByMonth(
  wines: readonly Wine[],
  ratings: readonly Rating[],
): TastingMonth[] {
  const byId = new Map(wines.map((wine) => [wine.id, wine]));
  const months: TastingMonth[] = [];
  for (const rating of [...ratings].sort(byNewestTasting)) {
    const month = rating.tastedOn.slice(0, 7);
    const item = { rating, wine: byId.get(rating.wineId) };
    const last = months[months.length - 1];
    if (last && last.month === month) last.tastings.push(item);
    else months.push({ month, tastings: [item] });
  }
  return months;
}
