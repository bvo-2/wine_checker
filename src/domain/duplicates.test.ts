import { describe, expect, it } from 'vitest';
import { findDuplicate, isSameWine, normalizeText } from './duplicates';
import type { Wine } from './types';

const stamp = '2025-01-01T00:00:00.000Z';
const wine = (id: string, name: string, producer?: string, vintage?: number): Wine => ({
  id,
  name,
  producer,
  vintage,
  createdAt: stamp,
  updatedAt: stamp,
});

describe('normalizeText', () => {
  it('ignores case and extra spaces', () => {
    expect(normalizeText('  Château   MARGAUX ')).toBe('château margaux');
    expect(normalizeText(undefined)).toBe('');
  });
});

describe('isSameWine', () => {
  it('matches on name, producer and vintage, ignoring case and spaces', () => {
    expect(
      isSameWine(
        { name: 'Barolo  Monfortino', producer: 'giacomo conterno', vintage: 2015 },
        { name: ' barolo monfortino ', producer: 'Giacomo  Conterno', vintage: 2015 },
      ),
    ).toBe(true);
  });

  it.each([
    ['a different vintage', { name: 'Barolo', producer: 'Conterno', vintage: 2016 }],
    ['no vintage', { name: 'Barolo', producer: 'Conterno' }],
    ['a different producer', { name: 'Barolo', producer: 'Vietti', vintage: 2015 }],
    ['no producer', { name: 'Barolo', vintage: 2015 }],
    ['a different name', { name: 'Barolo Riserva', producer: 'Conterno', vintage: 2015 }],
    ['different accents', { name: 'Baroló', producer: 'Conterno', vintage: 2015 }],
  ])('does not match with %s', (_label, other) => {
    expect(isSameWine({ name: 'Barolo', producer: 'Conterno', vintage: 2015 }, other)).toBe(false);
  });

  it('matches two wines that both lack producer and vintage', () => {
    expect(isSameWine({ name: 'House red' }, { name: 'HOUSE RED' })).toBe(true);
  });

  it('treats an empty producer like a missing one', () => {
    expect(isSameWine({ name: 'A', producer: '  ' }, { name: 'A' })).toBe(true);
  });
});

describe('findDuplicate', () => {
  const wines = [wine('1', 'Barolo', 'Conterno', 2015), wine('2', 'Chablis', undefined, 2019)];

  it('returns the matching wine', () => {
    expect(findDuplicate(wines, { name: 'chablis', vintage: 2019 })?.id).toBe('2');
  });

  it('returns undefined when nothing matches or the list is empty', () => {
    expect(findDuplicate(wines, { name: 'Chablis', vintage: 2020 })).toBeUndefined();
    expect(findDuplicate([], { name: 'Chablis' })).toBeUndefined();
  });

  it('can ignore the wine being edited', () => {
    expect(findDuplicate(wines, { name: 'Barolo', producer: 'Conterno', vintage: 2015 }, '1')).toBe(
      undefined,
    );
  });
});
