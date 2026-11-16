import { z } from 'zod';
import { isCountryCode } from './countries';
import { isIsoDate, todayIso } from './dates';
import { WINE_TYPES, type RatingInput, type WineInput } from './types';

export const LIMITS = {
  name: 200,
  text: 200,
  note: 2000,
  grapes: 20,
  vintageMin: 1800,
  abvMax: 25,
  priceMax: 1_000_000,
} as const;

export const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'UAH',
  'PLN',
  'CZK',
  'SEK',
  'NOK',
  'DKK',
  'HUF',
  'CAD',
  'AUD',
  'NZD',
  'ZAR',
  'JPY',
] as const;

/* ---------- Stored records (also used to validate imported backups) ---------- */

const timestamp = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid timestamp');
const shortText = z.string().trim().min(1).max(LIMITS.text);

export const wineSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(LIMITS.name),
  producer: shortText.optional(),
  vintage: z
    .number()
    .int()
    .min(LIMITS.vintageMin)
    .refine((v) => v <= new Date().getFullYear(), 'Vintage is in the future')
    .optional(),
  region: shortText.optional(),
  country: z.string().refine(isCountryCode, 'Unknown country code').optional(),
  type: z.enum(WINE_TYPES).optional(),
  grapes: z.array(shortText).max(LIMITS.grapes).optional(),
  abv: z.number().min(0).max(LIMITS.abvMax).optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const ratingSchema = z.object({
  id: z.string().min(1).max(100),
  wineId: z.string().min(1).max(100),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  note: z.string().min(1).max(LIMITS.note).optional(),
  pricePaid: z.number().min(0).max(LIMITS.priceMax).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  place: shortText.optional(),
  tastedOn: z
    .string()
    .refine(isIsoDate, 'Invalid date')
    .refine((v) => v <= todayIso(), 'Date is in the future'),
  createdAt: timestamp,
  updatedAt: timestamp,
});

/* ---------- Forms ---------- */

/** Raw values of the wine form: every field is the text the user typed. */
export interface WineFormValues {
  name: string;
  producer: string;
  vintage: string;
  region: string;
  country: string;
  type: string;
  grapes: string;
  abv: string;
}

/** Raw values of the tasting form. `stars` is 0 until a star is chosen. */
export interface RatingFormValues {
  stars: number;
  note: string;
  pricePaid: string;
  currency: string;
  place: string;
  tastedOn: string;
}

export const EMPTY_WINE_FORM: WineFormValues = {
  name: '',
  producer: '',
  vintage: '',
  region: '',
  country: '',
  type: '',
  grapes: '',
  abv: '',
};

export function emptyRatingForm(): RatingFormValues {
  return { stars: 0, note: '', pricePaid: '', currency: 'EUR', place: '', tastedOn: todayIso() };
}

const optionalText = (label: string, max: number = LIMITS.text) =>
  z
    .string()
    .trim()
    .max(max, `${label} can be at most ${max} characters`)
    .transform((v) => (v === '' ? undefined : v.replace(/\s+/g, ' ')));

/** Parses "13,5" or "13.5"; empty text means "not given". */
const optionalNumber = (invalidMessage: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return undefined;
      const n = /^-?\d+([.,]\d+)?$/.test(v) ? Number(v.replace(',', '.')) : Number.NaN;
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: 'custom', message: invalidMessage });
        return z.NEVER;
      }
      return n;
    });

export const wineFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter the name of the wine')
    .max(LIMITS.name, `Name can be at most ${LIMITS.name} characters`)
    .transform((v) => v.replace(/\s+/g, ' ')),
  producer: optionalText('Producer'),
  vintage: optionalNumber('Enter a year, for example 2019').refine(
    (v) =>
      v === undefined ||
      (Number.isInteger(v) && v >= LIMITS.vintageMin && v <= new Date().getFullYear()),
    { error: () => `Enter a year from ${LIMITS.vintageMin} to ${new Date().getFullYear()}` },
  ),
  region: optionalText('Region'),
  country: z
    .string()
    .refine((v) => v === '' || isCountryCode(v), 'Choose a country from the list')
    .transform((v) => (v === '' ? undefined : v)),
  type: z
    .union([z.literal(''), z.enum(WINE_TYPES)], { error: 'Choose a type from the list' })
    .transform((v) => (v === '' ? undefined : v)),
  grapes: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((g) => g.trim().replace(/\s+/g, ' '))
        .filter((g) => g !== ''),
    )
    .refine((v) => v.length <= LIMITS.grapes, `List at most ${LIMITS.grapes} grapes`)
    .refine(
      (v) => v.every((g) => g.length <= LIMITS.text),
      `Each grape can be at most ${LIMITS.text} characters`,
    )
    .transform((v) => (v.length === 0 ? undefined : v)),
  abv: optionalNumber('Enter a number, for example 13.5').refine(
    (v) => v === undefined || (v >= 0 && v <= LIMITS.abvMax),
    `Enter a strength from 0 to ${LIMITS.abvMax} %`,
  ),
});

export const ratingFormSchema = z
  .object({
    stars: z
      .number()
      .int()
      .min(1, 'Choose a rating from 1 to 5 stars')
      .max(5, 'Choose a rating from 1 to 5 stars'),
    note: z
      .string()
      .trim()
      .max(LIMITS.note, `Note can be at most ${LIMITS.note} characters`)
      .transform((v) => (v === '' ? undefined : v)),
    pricePaid: optionalNumber('Enter a price, for example 18.50').refine(
      (v) => v === undefined || (v >= 0 && v <= LIMITS.priceMax),
      'Enter a price of 0 or more',
    ),
    currency: z.string(),
    place: optionalText('Place'),
    tastedOn: z
      .string()
      .min(1, 'Enter the date you tasted it')
      .refine(isIsoDate, 'Enter a real date')
      .refine((v) => v <= todayIso(), 'The date cannot be in the future'),
  })
  .transform((v, ctx) => {
    const hasPrice = v.pricePaid !== undefined;
    if (hasPrice && !/^[A-Z]{3}$/.test(v.currency)) {
      ctx.addIssue({ code: 'custom', message: 'Choose a currency', path: ['currency'] });
      return z.NEVER;
    }
    return { ...v, currency: hasPrice ? v.currency : undefined };
  });

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
export type ParseResult<Out, Values> =
  { ok: true; data: Out } | { ok: false; errors: FieldErrors<Values> };

/** The first message for each field. */
function collectErrors<Values>(error: z.ZodError): FieldErrors<Values> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors as FieldErrors<Values>;
}

export function parseWineForm(values: WineFormValues): ParseResult<WineInput, WineFormValues> {
  const result = wineFormSchema.safeParse(values);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, errors: collectErrors(result.error) };
}

export function parseRatingForm(
  values: RatingFormValues,
): ParseResult<RatingInput, RatingFormValues> {
  const result = ratingFormSchema.safeParse(values);
  return result.success
    ? { ok: true, data: result.data as RatingInput }
    : { ok: false, errors: collectErrors(result.error) };
}

/** Form values for editing an existing wine. */
export function wineToForm(wine: WineInput): WineFormValues {
  return {
    name: wine.name,
    producer: wine.producer ?? '',
    vintage: wine.vintage?.toString() ?? '',
    region: wine.region ?? '',
    country: wine.country ?? '',
    type: wine.type ?? '',
    grapes: wine.grapes?.join(', ') ?? '',
    abv: wine.abv?.toString() ?? '',
  };
}

/** Form values for editing an existing tasting. */
export function ratingToForm(rating: RatingInput): RatingFormValues {
  return {
    stars: rating.stars,
    note: rating.note ?? '',
    pricePaid: rating.pricePaid?.toString() ?? '',
    currency: rating.currency ?? 'EUR',
    place: rating.place ?? '',
    tastedOn: rating.tastedOn,
  };
}
