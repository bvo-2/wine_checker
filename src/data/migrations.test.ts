import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { DecantDb, SCHEMA_VERSION } from './db';

/**
 * Each schema version gets a test here that writes data with the OLD schema and
 * opens it with the current code. When version 2 is added, copy the "version 1"
 * test, keep its old schema as written, and assert the upgraded shape.
 */
describe('schema migrations', () => {
  it('opens a database written by schema version 1 without losing data', async () => {
    const name = `decant-migration-${Math.random().toString(36).slice(2)}`;

    // Version 1 exactly as first shipped, written without the app's own classes.
    const v1 = new Dexie(name);
    v1.version(1).stores({
      wines: 'id, name, producer, region, country, type',
      ratings: 'id, wineId, tastedOn',
      meta: 'key',
    });
    const wine = {
      id: 'w1',
      name: 'Barolo',
      producer: 'Conterno',
      vintage: 2015,
      country: 'IT',
      type: 'red',
      grapes: ['Nebbiolo'],
      abv: 14.5,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const rating = {
      id: 'r1',
      wineId: 'w1',
      stars: 5,
      note: 'Superb',
      pricePaid: 120,
      currency: 'EUR',
      tastedOn: '2025-01-01',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    await v1.table('wines').add(wine);
    await v1.table('ratings').add(rating);
    await v1.table('meta').add({ key: 'lastExportAt', value: '2025-01-02T00:00:00.000Z' });
    v1.close();

    const current = new DecantDb(name);
    await current.open();
    expect(current.verno).toBe(SCHEMA_VERSION);
    expect(await current.wines.toArray()).toEqual([wine]);
    expect(await current.ratings.toArray()).toEqual([rating]);
    expect(await current.meta.get('lastExportAt')).toEqual({
      key: 'lastExportAt',
      value: '2025-01-02T00:00:00.000Z',
    });
    current.close();
  });

  it('has one declared version per schema change', () => {
    const db = new DecantDb(`decant-migration-${Math.random().toString(36).slice(2)}`);
    expect(db.verno).toBe(SCHEMA_VERSION);
    db.close();
  });
});
