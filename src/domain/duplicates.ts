import type { Wine, WineInput } from './types';

/** Lower-case, accents kept, extra spaces removed: "  Château   Margaux " → "château margaux". */
export function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

type Identity = Pick<WineInput, 'name' | 'producer' | 'vintage'>;

function identityKey(wine: Identity): string {
  return [normalizeText(wine.name), normalizeText(wine.producer), wine.vintage ?? ''].join('|');
}

/** Same name + producer + vintage, ignoring case and extra spaces. */
export function isSameWine(a: Identity, b: Identity): boolean {
  return identityKey(a) === identityKey(b);
}

/**
 * The existing wine that a new entry looks like, if any. This only ever feeds a
 * suggestion; wines are never merged automatically.
 */
export function findDuplicate(
  wines: readonly Wine[],
  candidate: Identity,
  ignoreId?: string,
): Wine | undefined {
  return wines.find((wine) => wine.id !== ignoreId && isSameWine(wine, candidate));
}
