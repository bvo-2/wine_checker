import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_WINE_FORM,
  emptyRatingForm,
  parseRatingForm,
  parseWineForm,
  ratingSchema,
  ratingToForm,
  wineSchema,
  wineToForm,
} from './schemas';
import { todayIso } from './dates';

afterEach(() => {
  vi.useRealTimers();
});

describe('parseWineForm', () => {
  it('needs only a name', () => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: '  Barolo   Riserva ' });
    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Barolo Riserva',
        producer: undefined,
        vintage: undefined,
        region: undefined,
        country: undefined,
        type: undefined,
        grapes: undefined,
        abv: undefined,
      },
    });
  });

  it('parses every field', () => {
    const result = parseWineForm({
      name: 'Monfortino',
      producer: ' Giacomo Conterno ',
      vintage: '2015',
      region: 'Piedmont',
      country: 'IT',
      type: 'red',
      grapes: 'Nebbiolo, , Barbera ',
      abv: '14,5',
    });
    expect(result.ok && result.data).toEqual({
      name: 'Monfortino',
      producer: 'Giacomo Conterno',
      vintage: 2015,
      region: 'Piedmont',
      country: 'IT',
      type: 'red',
      grapes: ['Nebbiolo', 'Barbera'],
      abv: 14.5,
    });
  });

  it('rejects an empty or blank name', () => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: '   ' });
    expect(result).toEqual({ ok: false, errors: { name: 'Enter the name of the wine' } });
  });

  it('rejects a name that is too long', () => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: 'x'.repeat(201) });
    expect(!result.ok && result.errors.name).toMatch(/at most 200/);
  });

  it.each(['1799', '20x9', '2019.5', '-5', 'abc'])('rejects vintage "%s"', (vintage) => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', vintage });
    expect(!result.ok && result.errors.vintage).toBeTruthy();
  });

  it('accepts 1800 and the current year, rejects next year', () => {
    vi.useFakeTimers({ now: new Date('2026-06-15T12:00:00') });
    expect(parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', vintage: '1800' }).ok).toBe(true);
    expect(parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', vintage: '2026' }).ok).toBe(true);
    const next = parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', vintage: '2027' });
    expect(!next.ok && next.errors.vintage).toBe('Enter a year from 1800 to 2026');
  });

  it.each([
    ['0', true],
    ['25', true],
    ['12.5', true],
    ['25.1', false],
    ['-1', false],
    ['strong', false],
  ])('abv "%s" valid: %s', (abv, valid) => {
    expect(parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', abv }).ok).toBe(valid);
  });

  it('rejects unknown countries and types', () => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: 'A', country: 'XX', type: 'blue' });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['country', 'type']);
  });

  it('reports all invalid fields at once', () => {
    const result = parseWineForm({ ...EMPTY_WINE_FORM, name: '', vintage: 'x', abv: '99' });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['abv', 'name', 'vintage']);
  });

  it('round-trips through wineToForm', () => {
    const wine = {
      name: 'Monfortino',
      producer: 'Giacomo Conterno',
      vintage: 2015,
      region: 'Piedmont',
      country: 'IT',
      type: 'red' as const,
      grapes: ['Nebbiolo', 'Barbera'],
      abv: 14.5,
    };
    const result = parseWineForm(wineToForm(wine));
    expect(result.ok && result.data).toEqual(wine);
  });
});

describe('parseRatingForm', () => {
  it('needs only stars; the date defaults to today', () => {
    const result = parseRatingForm({ ...emptyRatingForm(), stars: 4 });
    expect(result).toEqual({
      ok: true,
      data: {
        stars: 4,
        note: undefined,
        pricePaid: undefined,
        currency: undefined,
        place: undefined,
        tastedOn: todayIso(),
      },
    });
  });

  it('asks for a rating when no star is chosen', () => {
    const result = parseRatingForm(emptyRatingForm());
    expect(result).toEqual({ ok: false, errors: { stars: 'Choose a rating from 1 to 5 stars' } });
  });

  it.each([0, 6, 2.5])('rejects %s stars', (stars) => {
    expect(parseRatingForm({ ...emptyRatingForm(), stars }).ok).toBe(false);
  });

  it('accepts a 2000-character note and rejects 2001', () => {
    const base = { ...emptyRatingForm(), stars: 3 };
    expect(parseRatingForm({ ...base, note: 'n'.repeat(2000) }).ok).toBe(true);
    const tooLong = parseRatingForm({ ...base, note: 'n'.repeat(2001) });
    expect(!tooLong.ok && tooLong.errors.note).toMatch(/at most 2000/);
  });

  it('accepts today and rejects tomorrow', () => {
    vi.useFakeTimers({ now: new Date('2026-03-10T23:30:00') });
    const base = { ...emptyRatingForm(), stars: 3 };
    expect(parseRatingForm({ ...base, tastedOn: '2026-03-10' }).ok).toBe(true);
    const future = parseRatingForm({ ...base, tastedOn: '2026-03-11' });
    expect(!future.ok && future.errors.tastedOn).toBe('The date cannot be in the future');
  });

  it.each(['', '2025-02-30', '10/03/2025', 'yesterday'])('rejects date "%s"', (tastedOn) => {
    const result = parseRatingForm({ ...emptyRatingForm(), stars: 3, tastedOn });
    expect(!result.ok && result.errors.tastedOn).toBeTruthy();
  });

  it('keeps the currency only when a price is given', () => {
    const base = { ...emptyRatingForm(), stars: 5, currency: 'GBP' };
    const withPrice = parseRatingForm({ ...base, pricePaid: '18,50' });
    expect(withPrice.ok && withPrice.data).toMatchObject({ pricePaid: 18.5, currency: 'GBP' });
    const without = parseRatingForm(base);
    expect(without.ok && without.data.currency).toBeUndefined();
  });

  it.each(['-1', 'cheap', '1e3'])('rejects price "%s"', (pricePaid) => {
    const result = parseRatingForm({ ...emptyRatingForm(), stars: 3, pricePaid });
    expect(!result.ok && result.errors.pricePaid).toBeTruthy();
  });

  it('round-trips through ratingToForm', () => {
    const rating = {
      stars: 4 as const,
      note: 'Cherries.\nLong finish.',
      pricePaid: 32,
      currency: 'USD',
      place: 'At home',
      tastedOn: '2024-12-24',
    };
    const result = parseRatingForm(ratingToForm(rating));
    expect(result.ok && result.data).toEqual(rating);
  });
});

describe('stored record schemas', () => {
  const stamp = '2025-01-01T10:00:00.000Z';

  it('accepts a minimal wine and rating', () => {
    expect(
      wineSchema.safeParse({ id: 'w1', name: 'A', createdAt: stamp, updatedAt: stamp }).success,
    ).toBe(true);
    expect(
      ratingSchema.safeParse({
        id: 'r1',
        wineId: 'w1',
        stars: 5,
        tastedOn: '2025-01-01',
        createdAt: stamp,
        updatedAt: stamp,
      }).success,
    ).toBe(true);
  });

  it('rejects out-of-range values', () => {
    const wine = { id: 'w1', name: 'A', createdAt: stamp, updatedAt: stamp };
    expect(wineSchema.safeParse({ ...wine, vintage: 1700 }).success).toBe(false);
    expect(wineSchema.safeParse({ ...wine, abv: 40 }).success).toBe(false);
    expect(wineSchema.safeParse({ ...wine, country: 'Italy' }).success).toBe(false);
    expect(wineSchema.safeParse({ ...wine, name: '' }).success).toBe(false);
    const rating = {
      id: 'r1',
      wineId: 'w1',
      stars: 5,
      tastedOn: '2025-01-01',
      createdAt: stamp,
      updatedAt: stamp,
    };
    expect(ratingSchema.safeParse({ ...rating, stars: 6 }).success).toBe(false);
    expect(ratingSchema.safeParse({ ...rating, tastedOn: '2999-01-01' }).success).toBe(false);
    expect(ratingSchema.safeParse({ ...rating, createdAt: 'never' }).success).toBe(false);
  });
});
