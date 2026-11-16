export const WINE_TYPES = ['red', 'white', 'rose', 'orange', 'sparkling', 'dessert'] as const;
export type WineType = (typeof WINE_TYPES)[number];

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  red: 'Red',
  white: 'White',
  rose: 'Rosé',
  orange: 'Orange',
  sparkling: 'Sparkling',
  dessert: 'Dessert',
};

export type Stars = 1 | 2 | 3 | 4 | 5;

/** A wine as a product. */
export interface Wine {
  id: string;
  name: string;
  producer?: string;
  /** 1800 to the current year. */
  vintage?: number;
  region?: string;
  /** ISO 3166-1 alpha-2 code. */
  country?: string;
  type?: WineType;
  grapes?: string[];
  /** Alcohol by volume, 0 to 25 (%). */
  abv?: number;
  createdAt: string;
  updatedAt: string;
}

/** One tasting of a wine. */
export interface Rating {
  id: string;
  wineId: string;
  stars: Stars;
  /** Up to 2000 characters. */
  note?: string;
  pricePaid?: number;
  /** ISO 4217 code; set when pricePaid is set. */
  currency?: string;
  place?: string;
  /** Local calendar date, YYYY-MM-DD, never in the future. */
  tastedOn: string;
  createdAt: string;
  updatedAt: string;
}

/** The editable fields of a wine. */
export type WineInput = Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>;
/** The editable fields of a tasting. */
export type RatingInput = Omit<Rating, 'id' | 'wineId' | 'createdAt' | 'updatedAt'>;
