import { liveQuery } from 'dexie';
import type { Rating, RatingInput, Wine, WineInput } from '../domain/types';
import type { DecantDb } from './db';

/**
 * The only way the UI reads or writes data. To move storage to a server later,
 * write another implementation of these interfaces; no screen needs to change.
 */
export interface WineRepository {
  list(): Promise<Wine[]>;
  get(id: string): Promise<Wine | undefined>;
  create(input: WineInput): Promise<Wine>;
  /** Saves a new wine and its first tasting together: both or neither. */
  createWithRating(wine: WineInput, rating: RatingInput): Promise<{ wine: Wine; rating: Rating }>;
  update(id: string, input: WineInput): Promise<Wine>;
  /** Deletes the wine and all of its tastings. */
  remove(id: string): Promise<void>;
}

export interface RatingRepository {
  list(): Promise<Rating[]>;
  listForWine(wineId: string): Promise<Rating[]>;
  get(id: string): Promise<Rating | undefined>;
  create(wineId: string, input: RatingInput): Promise<Rating>;
  update(id: string, input: RatingInput): Promise<Rating>;
  remove(id: string): Promise<void>;
}

export interface Repositories {
  wines: WineRepository;
  ratings: RatingRepository;
  /**
   * Runs `query` now and again whenever the data it read changes.
   * Returns a function that stops watching.
   */
  watch<T>(
    query: () => Promise<T>,
    onValue: (value: T) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    // Not 'NotFoundError': Dexie would mistake that for its own error of the same name.
    this.name = 'RecordNotFoundError';
  }
}

export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // crypto.randomUUID needs a secure context; this covers plain-http hosting.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Drops keys whose value is undefined so stored records stay tidy. */
function compact<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as T;
}

export function createRepositories(
  db: DecantDb,
  now: () => string = () => new Date().toISOString(),
): Repositories {
  function buildWine(input: WineInput): Wine {
    const stamp = now();
    return compact({ ...input, id: newId(), createdAt: stamp, updatedAt: stamp });
  }
  function buildRating(wineId: string, input: RatingInput): Rating {
    const stamp = now();
    return compact({ ...input, id: newId(), wineId, createdAt: stamp, updatedAt: stamp });
  }

  const wines: WineRepository = {
    list: () => db.wines.toArray(),
    get: (id) => db.wines.get(id),
    async create(input) {
      const wine = buildWine(input);
      await db.wines.add(wine);
      return wine;
    },
    createWithRating(wineInput, ratingInput) {
      return db.transaction('rw', db.wines, db.ratings, async () => {
        const wine = buildWine(wineInput);
        const rating = buildRating(wine.id, ratingInput);
        await db.wines.add(wine);
        await db.ratings.add(rating);
        return { wine, rating };
      });
    },
    update(id, input) {
      return db.transaction('rw', db.wines, async () => {
        const existing = await db.wines.get(id);
        if (!existing) throw new NotFoundError('Wine');
        const wine: Wine = compact({
          ...input,
          id,
          createdAt: existing.createdAt,
          updatedAt: now(),
        });
        // put() replaces the record, so cleared optional fields are really removed.
        await db.wines.put(wine);
        return wine;
      });
    },
    remove(id) {
      return db.transaction('rw', db.wines, db.ratings, async () => {
        await db.ratings.where('wineId').equals(id).delete();
        await db.wines.delete(id);
      });
    },
  };

  const ratings: RatingRepository = {
    list: () => db.ratings.toArray(),
    listForWine: (wineId) => db.ratings.where('wineId').equals(wineId).toArray(),
    get: (id) => db.ratings.get(id),
    create(wineId, input) {
      return db.transaction('rw', db.wines, db.ratings, async () => {
        if (!(await db.wines.get(wineId))) throw new NotFoundError('Wine');
        const rating = buildRating(wineId, input);
        await db.ratings.add(rating);
        return rating;
      });
    },
    update(id, input) {
      return db.transaction('rw', db.ratings, async () => {
        const existing = await db.ratings.get(id);
        if (!existing) throw new NotFoundError('Tasting');
        const rating: Rating = compact({
          ...input,
          id,
          wineId: existing.wineId,
          createdAt: existing.createdAt,
          updatedAt: now(),
        });
        await db.ratings.put(rating);
        return rating;
      });
    },
    remove: (id) => db.ratings.delete(id),
  };

  return {
    wines,
    ratings,
    watch(query, onValue, onError) {
      const subscription = liveQuery(query).subscribe({ next: onValue, error: onError });
      return () => subscription.unsubscribe();
    },
  };
}
