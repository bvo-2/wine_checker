import { countryName } from './countries';
import { WINE_TYPE_LABELS, type Rating, type Wine } from './types';

/** Scores always show one decimal: 4 → "4.0". */
export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatPrice(amount: number, currency: string | undefined): string {
  if (!currency) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function plural(count: number, one: string, many: string = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "2019 · Red", "NV · Sparkling" or "NV". */
export function vintageLine(wine: Pick<Wine, 'vintage' | 'type'>): string {
  return [wine.vintage ?? 'NV', wine.type && WINE_TYPE_LABELS[wine.type]]
    .filter(Boolean)
    .join(' · ');
}

/** "Giacomo Conterno · Piedmont · Italy", leaving out what is unknown. */
export function originLine(wine: Pick<Wine, 'producer' | 'region' | 'country'>): string {
  return [wine.producer, wine.region, wine.country && countryName(wine.country)]
    .filter(Boolean)
    .join(' · ');
}

export function priceLine(rating: Pick<Rating, 'pricePaid' | 'currency'>): string | undefined {
  return rating.pricePaid === undefined
    ? undefined
    : formatPrice(rating.pricePaid, rating.currency);
}
