import { z } from 'zod';
import { ratingSchema, wineSchema } from './schemas';
import type { Rating, Wine } from './types';

/** Version of the backup file layout. Raise it (and add a converter) if the layout changes. */
export const BACKUP_FORMAT_VERSION = 1;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export interface BackupData {
  app: 'decant';
  formatVersion: number;
  exportedAt: string;
  wines: Wine[];
  ratings: Rating[];
}

const backupSchema = z.object({
  app: z.literal('decant'),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid timestamp'),
  wines: z.array(wineSchema),
  ratings: z.array(ratingSchema),
});

export function buildBackup(wines: Wine[], ratings: Rating[], now: Date = new Date()): BackupData {
  return {
    app: 'decant',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    wines,
    ratings,
  };
}

export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `decant-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type BackupParseResult = { ok: true; data: BackupData } | { ok: false; message: string };

const NOT_A_BACKUP = 'This file is not a Decant backup.';

function firstDuplicate(ids: string[]): string | undefined {
  const seen = new Set<string>();
  return ids.find((id) => seen.size === seen.add(id).size);
}

/**
 * Checks the text of a backup file completely before anything is written.
 * Any problem rejects the whole file with a message a person can act on.
 */
export function parseBackup(text: string): BackupParseResult {
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, message: 'This file is too large to be a Decant backup.' };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: `${NOT_A_BACKUP} It is not valid JSON; it may be damaged.` };
  }
  if (typeof json !== 'object' || json === null || (json as { app?: unknown }).app !== 'decant') {
    return { ok: false, message: NOT_A_BACKUP };
  }
  const version = (json as { formatVersion?: unknown }).formatVersion;
  if (typeof version === 'number' && version > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      message:
        'This backup was made by a newer version of Decant. Update the app, then import it again.',
    };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.join(' → ') || 'file';
    return {
      ok: false,
      message: `This backup is damaged: ${where}: ${issue?.message ?? 'invalid value'}.`,
    };
  }
  const data = result.data as BackupData;
  const duplicate =
    firstDuplicate(data.wines.map((w) => w.id)) ?? firstDuplicate(data.ratings.map((r) => r.id));
  if (duplicate) {
    return { ok: false, message: `This backup is damaged: the id "${duplicate}" appears twice.` };
  }
  const wineIds = new Set(data.wines.map((w) => w.id));
  const orphan = data.ratings.find((r) => !wineIds.has(r.wineId));
  if (orphan) {
    return {
      ok: false,
      message: `This backup is damaged: the tasting of ${orphan.tastedOn} belongs to a wine that is not in the file.`,
    };
  }
  return { ok: true, data };
}

export type ImportMode = 'merge' | 'replace';

export interface ImportPlan {
  /** Records to write. */
  wines: Wine[];
  ratings: Rating[];
  added: { wines: number; ratings: number };
  updated: { wines: number; ratings: number };
  /** In the file but older than (or the same as) what is stored: left alone. */
  unchanged: { wines: number; ratings: number };
  /** Stored records that will be deleted. Always zero for a merge. */
  removed: { wines: number; ratings: number };
}

function mergeRecords<T extends { id: string; updatedAt: string }>(incoming: T[], current: T[]) {
  const stored = new Map(current.map((record) => [record.id, record]));
  const write: T[] = [];
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  for (const record of incoming) {
    const existing = stored.get(record.id);
    if (!existing) {
      added += 1;
      write.push(record);
    } else if (record.updatedAt > existing.updatedAt) {
      updated += 1;
      write.push(record);
    } else {
      unchanged += 1;
    }
  }
  return { write, added, updated, unchanged };
}

/**
 * Works out what an import would do, without doing it.
 * merge: add what is new, and update a stored record only if the file's copy is newer.
 *        Nothing is deleted.
 * replace: delete everything stored and keep exactly what is in the file.
 */
export function planImport(
  backup: BackupData,
  current: { wines: Wine[]; ratings: Rating[] },
  mode: ImportMode,
): ImportPlan {
  if (mode === 'replace') {
    return {
      wines: backup.wines,
      ratings: backup.ratings,
      added: { wines: backup.wines.length, ratings: backup.ratings.length },
      updated: { wines: 0, ratings: 0 },
      unchanged: { wines: 0, ratings: 0 },
      removed: { wines: current.wines.length, ratings: current.ratings.length },
    };
  }
  const wines = mergeRecords(backup.wines, current.wines);
  const ratings = mergeRecords(backup.ratings, current.ratings);
  return {
    wines: wines.write,
    ratings: ratings.write,
    added: { wines: wines.added, ratings: ratings.added },
    updated: { wines: wines.updated, ratings: ratings.updated },
    unchanged: { wines: wines.unchanged, ratings: ratings.unchanged },
    removed: { wines: 0, ratings: 0 },
  };
}

export const BACKUP_REMINDER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True when it is time to suggest a backup: there is data, and the last export
 * (or, if there has never been one, the oldest record) is more than 30 days old.
 */
export function isBackupDue(
  lastExportAt: string | undefined,
  oldestRecordAt: string | undefined,
  now: Date = new Date(),
): boolean {
  if (!oldestRecordAt) return false;
  const since = Date.parse(lastExportAt ?? oldestRecordAt);
  if (Number.isNaN(since)) return true;
  return now.getTime() - since > BACKUP_REMINDER_DAYS * DAY_MS;
}
