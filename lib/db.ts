import "server-only";
import { DatabaseSync } from "node:sqlite";
import type { CellarWine, WineType } from "./types";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const filename = url.replace(/^file:/, "");

function open(): DatabaseSync {
  const db = new DatabaseSync(filename, { timeout: 5000 });
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS wines (
      id               TEXT PRIMARY KEY,
      source           TEXT NOT NULL CHECK (source IN ('wineapi', 'manual')),
      name             TEXT NOT NULL,
      winery           TEXT,
      region           TEXT,
      country          TEXT,
      vintage          INTEGER,
      type             TEXT,
      image_url        TEXT,
      community_rating REAL,
      community_count  INTEGER,
      saved_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ratings (
      wine_id  TEXT PRIMARY KEY REFERENCES wines(id) ON DELETE CASCADE,
      score    INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      note     TEXT,
      rated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

// Open lazily (so builds never touch the file) and reuse one connection across hot reloads.
const g = globalThis as unknown as { __decantDb?: DatabaseSync };
function conn(): DatabaseSync {
  return (g.__decantDb ??= open());
}

type Row = Record<string, unknown>;

function toWine(r: Row): CellarWine {
  return {
    id: r.id as string,
    source: r.source as CellarWine["source"],
    name: r.name as string,
    winery: (r.winery as string) ?? null,
    region: (r.region as string) ?? null,
    country: (r.country as string) ?? null,
    vintage: (r.vintage as number) ?? null,
    type: (r.type as WineType) ?? null,
    imageUrl: (r.image_url as string) ?? null,
    communityRating: (r.community_rating as number) ?? null,
    communityCount: (r.community_count as number) ?? null,
    savedAt: r.saved_at as string,
    score: (r.score as number) ?? null,
    note: (r.note as string) ?? null,
    ratedAt: (r.rated_at as string) ?? null,
  };
}

const SELECT = `
  SELECT w.*, r.score, r.note, r.rated_at
  FROM wines w LEFT JOIN ratings r ON r.wine_id = w.id`;

export type CellarSort = "recent" | "rating" | "name";

export function listCellar(opts: { type?: WineType; sort?: CellarSort } = {}): CellarWine[] {
  const order =
    opts.sort === "rating"
      ? "r.score IS NULL, r.score DESC, w.name"
      : opts.sort === "name"
        ? "w.name COLLATE NOCASE"
        : "COALESCE(r.rated_at, w.saved_at) DESC";
  const rows = opts.type
    ? conn().prepare(`${SELECT} WHERE w.type = ? ORDER BY ${order}`).all(opts.type)
    : conn().prepare(`${SELECT} ORDER BY ${order}`).all();
  return rows.map((r) => toWine(r as Row));
}

export function getCellarWine(id: string): CellarWine | null {
  const r = conn().prepare(`${SELECT} WHERE w.id = ?`).get(id);
  return r ? toWine(r as Row) : null;
}

export function savedIds(ids: string[]): Set<string> {
  if (ids.length === 0) return new Set();
  const rows = conn()
    .prepare(`SELECT id FROM wines WHERE id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids);
  return new Set(rows.map((r) => (r as Row).id as string));
}

export interface WineInput {
  id: string;
  source: CellarWine["source"];
  name: string;
  winery?: string | null;
  region?: string | null;
  country?: string | null;
  vintage?: number | null;
  type?: WineType | null;
  imageUrl?: string | null;
  communityRating?: number | null;
  communityCount?: number | null;
}

export function saveWine(w: WineInput): void {
  conn().prepare(
    `INSERT INTO wines (id, source, name, winery, region, country, vintage, type, image_url, community_rating, community_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, winery = excluded.winery, region = excluded.region,
       country = excluded.country, vintage = excluded.vintage, type = excluded.type,
       image_url = COALESCE(excluded.image_url, wines.image_url),
       community_rating = excluded.community_rating, community_count = excluded.community_count`,
  ).run(
    w.id,
    w.source,
    w.name,
    w.winery ?? null,
    w.region ?? null,
    w.country ?? null,
    w.vintage ?? null,
    w.type ?? null,
    w.imageUrl ?? null,
    w.communityRating ?? null,
    w.communityCount ?? null,
  );
}

export function removeWine(id: string): void {
  conn().prepare("DELETE FROM ratings WHERE wine_id = ?").run(id);
  conn().prepare("DELETE FROM wines WHERE id = ?").run(id);
}

export function setRating(wineId: string, score: number, note?: string | null): void {
  conn().prepare(
    `INSERT INTO ratings (wine_id, score, note) VALUES (?, ?, ?)
     ON CONFLICT(wine_id) DO UPDATE SET
       score = excluded.score,
       note = COALESCE(excluded.note, ratings.note),
       rated_at = datetime('now')`,
  ).run(wineId, score, note ?? null);
}

export function setNote(wineId: string, note: string): void {
  conn().prepare("UPDATE ratings SET note = ?, rated_at = datetime('now') WHERE wine_id = ?").run(note, wineId);
}

export function cellarStats(): { total: number; rated: number; average: number | null } {
  const r = conn()
    .prepare(
      `SELECT COUNT(*) AS total, COUNT(r.score) AS rated, AVG(r.score) AS average
       FROM wines w LEFT JOIN ratings r ON r.wine_id = w.id`,
    )
    .get() as Row;
  return {
    total: Number(r.total),
    rated: Number(r.rated),
    average: r.average == null ? null : Number(r.average),
  };
}
