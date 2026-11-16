import { beforeEach, describe, expect, it } from 'vitest';
import type { DecantDb } from './db';
import { createRepositories, newId, NotFoundError, type Repositories } from './repositories';
import { createTestDb } from './testing';

let db: DecantDb;
let repos: Repositories;
let clock: number;

beforeEach(() => {
  db = createTestDb();
  clock = Date.parse('2025-01-01T00:00:00.000Z');
  repos = createRepositories(db, () => new Date((clock += 1000)).toISOString());
});

const TASTING = { stars: 4, tastedOn: '2025-01-01' } as const;

describe('WineRepository', () => {
  it('creates a wine with an id and timestamps and reads it back', async () => {
    const wine = await repos.wines.create({ name: 'Barolo', vintage: 2019 });
    expect(wine.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(wine.createdAt).toBe(wine.updatedAt);
    expect(await repos.wines.get(wine.id)).toEqual(wine);
    expect(await repos.wines.list()).toEqual([wine]);
  });

  it('does not store undefined fields', async () => {
    const wine = await repos.wines.create({ name: 'Barolo', producer: undefined });
    expect(Object.keys(wine).sort()).toEqual(['createdAt', 'id', 'name', 'updatedAt']);
  });

  it('creates a wine and its first tasting together', async () => {
    const { wine, rating } = await repos.wines.createWithRating({ name: 'Barolo' }, TASTING);
    expect(rating.wineId).toBe(wine.id);
    expect(await repos.ratings.listForWine(wine.id)).toEqual([rating]);
  });

  it('saves neither wine nor tasting if one of them fails', async () => {
    const existing = await repos.wines.createWithRating({ name: 'A' }, TASTING);
    // Force the second write to fail by making the ratings table reject it.
    db.ratings.hook('creating', () => {
      throw new Error('disk full');
    });
    await expect(repos.wines.createWithRating({ name: 'B' }, TASTING)).rejects.toThrow();
    expect((await repos.wines.list()).map((w) => w.name)).toEqual([existing.wine.name]);
  });

  it('updates a wine, keeps createdAt and removes cleared fields', async () => {
    const wine = await repos.wines.create({ name: 'Barolo', producer: 'Conterno', vintage: 2019 });
    const updated = await repos.wines.update(wine.id, { name: 'Barolo Riserva', vintage: 2019 });
    expect(updated.createdAt).toBe(wine.createdAt);
    expect(updated.updatedAt > wine.updatedAt).toBe(true);
    const stored = await repos.wines.get(wine.id);
    expect(stored).toEqual(updated);
    expect(stored && 'producer' in stored).toBe(false);
  });

  it('refuses to update a wine that does not exist', async () => {
    await expect(repos.wines.update('missing', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await repos.wines.list()).toEqual([]);
  });

  it('deletes a wine with its tastings and leaves other wines alone', async () => {
    const a = await repos.wines.createWithRating({ name: 'A' }, TASTING);
    await repos.ratings.create(a.wine.id, { stars: 2, tastedOn: '2025-01-02' });
    const b = await repos.wines.createWithRating({ name: 'B' }, TASTING);
    await repos.wines.remove(a.wine.id);
    expect(await repos.wines.list()).toEqual([b.wine]);
    expect(await repos.ratings.list()).toEqual([b.rating]);
  });
});

describe('RatingRepository', () => {
  it('adds several tastings to one wine', async () => {
    const wine = await repos.wines.create({ name: 'A' });
    await repos.ratings.create(wine.id, TASTING);
    await repos.ratings.create(wine.id, { stars: 5, tastedOn: '2025-02-01', note: 'Better' });
    expect(await repos.ratings.listForWine(wine.id)).toHaveLength(2);
    expect(await repos.ratings.list()).toHaveLength(2);
  });

  it('refuses a tasting for a wine that does not exist', async () => {
    await expect(repos.ratings.create('missing', TASTING)).rejects.toBeInstanceOf(NotFoundError);
    expect(await repos.ratings.list()).toEqual([]);
  });

  it('updates a tasting without moving it to another wine', async () => {
    const { wine, rating } = await repos.wines.createWithRating(
      { name: 'A' },
      { ...TASTING, note: 'x' },
    );
    const updated = await repos.ratings.update(rating.id, { stars: 2, tastedOn: '2024-12-31' });
    expect(updated).toMatchObject({
      id: rating.id,
      wineId: wine.id,
      stars: 2,
      createdAt: rating.createdAt,
    });
    expect('note' in updated).toBe(false);
    expect(await repos.ratings.get(rating.id)).toEqual(updated);
  });

  it('refuses to update a tasting that does not exist', async () => {
    await expect(repos.ratings.update('missing', TASTING)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes one tasting and keeps the wine', async () => {
    const { wine, rating } = await repos.wines.createWithRating({ name: 'A' }, TASTING);
    await repos.ratings.remove(rating.id);
    expect(await repos.ratings.list()).toEqual([]);
    expect(await repos.wines.get(wine.id)).toEqual(wine);
  });
});

describe('persistence', () => {
  it('keeps data after the database is closed and reopened', async () => {
    const { wine, rating } = await repos.wines.createWithRating({ name: 'Barolo' }, TASTING);
    const name = db.name;
    db.close();
    const { DecantDb } = await import('./db');
    const reopened = createRepositories(new DecantDb(name));
    expect(await reopened.wines.list()).toEqual([wine]);
    expect(await reopened.ratings.list()).toEqual([rating]);
  });
});

describe('watch', () => {
  it('emits the current value and again after a change', async () => {
    const seen: number[] = [];
    const stop = repos.watch(
      async () => (await repos.wines.list()).length,
      (count) => seen.push(count),
      (error) => {
        throw error;
      },
    );
    await expect.poll(() => seen).toEqual([0]);
    await repos.wines.create({ name: 'A' });
    await expect.poll(() => seen).toEqual([0, 1]);
    stop();
    await repos.wines.create({ name: 'B' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(seen).toEqual([0, 1]);
  });
});

describe('newId', () => {
  it('makes unique UUIDs, also without crypto.randomUUID', () => {
    const original = crypto.randomUUID;
    try {
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
      const ids = new Set(Array.from({ length: 100 }, newId));
      expect(ids.size).toBe(100);
      for (const id of ids) {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      }
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
