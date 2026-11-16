import { DecantDb } from './db';
import { createRepositories, type Repositories } from './repositories';

let counter = 0;

/** A fresh, empty database (backed by fake-indexeddb in tests). */
export function createTestDb(): DecantDb {
  counter += 1;
  return new DecantDb(`decant-test-${counter}-${Math.random().toString(36).slice(2)}`);
}

export function createTestRepositories(): { db: DecantDb; repos: Repositories } {
  const db = createTestDb();
  return { db, repos: createRepositories(db) };
}
