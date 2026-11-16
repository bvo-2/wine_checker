import Dexie, { type Table } from 'dexie';
import type { Rating, Wine } from '../domain/types';

export interface MetaRecord {
  key: string;
  value: string;
}

/**
 * The IndexedDB database.
 *
 * Changing a stored shape? Add a new `this.version(n + 1).stores(...).upgrade(...)`
 * below (never edit an existing version) and add a test in migrations.test.ts that
 * upgrades data written by the previous version.
 */
export class DecantDb extends Dexie {
  wines!: Table<Wine, string>;
  ratings!: Table<Rating, string>;
  meta!: Table<MetaRecord, string>;

  constructor(name = 'decant') {
    super(name);
    this.version(1).stores({
      wines: 'id, name, producer, region, country, type',
      ratings: 'id, wineId, tastedOn',
      meta: 'key',
    });
  }
}

export const SCHEMA_VERSION = 1;
