import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  buildBackup,
  isBackupDue,
  MAX_BACKUP_BYTES,
  parseBackup,
  planImport,
} from './backup';
import type { Rating, Wine } from './types';

const stamp = (day: number) => `2025-01-${String(day).padStart(2, '0')}T00:00:00.000Z`;
const wine = (id: string, updated = 1, extra: Partial<Wine> = {}): Wine => ({
  id,
  name: `Wine ${id}`,
  createdAt: stamp(1),
  updatedAt: stamp(updated),
  ...extra,
});
const rating = (id: string, wineId: string, updated = 1): Rating => ({
  id,
  wineId,
  stars: 4,
  tastedOn: '2025-01-01',
  createdAt: stamp(1),
  updatedAt: stamp(updated),
});

const valid = () => buildBackup([wine('w1'), wine('w2')], [rating('r1', 'w1')], new Date(stamp(5)));
const text = (value: unknown) => JSON.stringify(value);

describe('buildBackup and parseBackup', () => {
  it('round-trips: what is exported can be imported unchanged', () => {
    const backup = valid();
    expect(backup).toMatchObject({ app: 'decant', formatVersion: 1, exportedAt: stamp(5) });
    expect(parseBackup(text(backup))).toEqual({ ok: true, data: backup });
  });

  it('round-trips a wine with every field and unusual characters', () => {
    const full = wine('w1', 1, {
      name: 'Châteauneuf-du-Pape "Cuvée" <b>🍷</b>',
      producer: 'Domaine du Vieux Télégraphe',
      vintage: 2016,
      region: 'Rhône',
      country: 'FR',
      type: 'red',
      grapes: ['Grenache', 'Syrah'],
      abv: 14.5,
    });
    const backup = buildBackup(
      [full],
      [{ ...rating('r1', 'w1'), note: 'Line one\nLine two', pricePaid: 0, currency: 'EUR' }],
    );
    expect(parseBackup(text(backup))).toEqual({ ok: true, data: backup });
  });

  it('accepts an empty backup', () => {
    expect(parseBackup(text(buildBackup([], []))).ok).toBe(true);
  });

  it.each([
    ['not JSON', '{"app": "decant", "wines": ['],
    ['an empty file', ''],
    ['a JSON array', '[]'],
    ['null', 'null'],
    ['some other JSON', '{"hello":"world"}'],
    ['another app', text({ ...valid(), app: 'vivino' })],
  ])('rejects %s', (_label, input) => {
    const result = parseBackup(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toMatch(/not a Decant backup/);
  });

  it('rejects a backup from a newer version with a specific message', () => {
    const result = parseBackup(text({ ...valid(), formatVersion: 2 }));
    expect(!result.ok && result.message).toMatch(/newer version of Decant/);
  });

  it.each([
    ['a missing wines list', (b: Record<string, unknown>) => delete b.wines],
    ['a wine without a name', (b: { wines: Partial<Wine>[] }) => delete b.wines[0]?.name],
    [
      'an impossible vintage',
      (b: { wines: Wine[] }) => Object.assign(b.wines[0] ?? {}, { vintage: 1500 }),
    ],
    [
      'a rating of 9 stars',
      (b: { ratings: Rating[] }) => Object.assign(b.ratings[0] ?? {}, { stars: 9 }),
    ],
    [
      'a text rating',
      (b: { ratings: Rating[] }) => Object.assign(b.ratings[0] ?? {}, { stars: '4' }),
    ],
    [
      'a tasting in the future',
      (b: { ratings: Rating[] }) => Object.assign(b.ratings[0] ?? {}, { tastedOn: '2999-01-01' }),
    ],
    ['a missing format version', (b: Record<string, unknown>) => delete b.formatVersion],
  ] as [string, (b: never) => unknown][])('rejects %s as damaged', (_label, damage) => {
    const backup = JSON.parse(text(valid())) as never;
    damage(backup);
    const result = parseBackup(text(backup));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toMatch(/damaged/);
  });

  it.each(['../evil', 'a/b', 'a\\b', 'a b', '', 'x'.repeat(101)])(
    'rejects the unsafe id %j',
    (id) => {
      const result = parseBackup(text(buildBackup([wine(id)], [])));
      expect(!result.ok && result.message).toMatch(/damaged/);
    },
  );

  it('rejects duplicate ids', () => {
    const result = parseBackup(text(buildBackup([wine('w1'), wine('w1')], [])));
    expect(!result.ok && result.message).toMatch(/"w1" appears twice/);
  });

  it('rejects a tasting whose wine is not in the file', () => {
    const result = parseBackup(text(buildBackup([wine('w1')], [rating('r1', 'gone')])));
    expect(!result.ok && result.message).toMatch(/belongs to a wine that is not in the file/);
  });

  it('rejects a file that is too large', () => {
    const result = parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1));
    expect(!result.ok && result.message).toMatch(/too large/);
  });

  it('names the backup file after the local date', () => {
    expect(backupFileName(new Date(2025, 2, 7))).toBe('decant-backup-2025-03-07.json');
  });
});

describe('planImport', () => {
  const current = {
    wines: [wine('w1', 5), wine('w3', 5)],
    ratings: [rating('r1', 'w1', 5), rating('r3', 'w3', 5)],
  };

  it('merge adds new records, updates only when the file is newer, and deletes nothing', () => {
    const backup = buildBackup(
      [wine('w1', 9, { name: 'Renamed' }), wine('w2'), wine('w3', 2, { name: 'Stale' })],
      [rating('r1', 'w1', 5), rating('r2', 'w2')],
    );
    const plan = planImport(backup, current, 'merge');
    expect(plan.added).toEqual({ wines: 1, ratings: 1 });
    expect(plan.updated).toEqual({ wines: 1, ratings: 0 });
    expect(plan.unchanged).toEqual({ wines: 1, ratings: 1 });
    expect(plan.removed).toEqual({ wines: 0, ratings: 0 });
    expect(plan.wines.map((w) => w.name).sort()).toEqual(['Renamed', 'Wine w2']);
    expect(plan.ratings.map((r) => r.id)).toEqual(['r2']);
  });

  it('merging a backup into the data it was made from changes nothing', () => {
    const plan = planImport(buildBackup(current.wines, current.ratings), current, 'merge');
    expect(plan.wines).toEqual([]);
    expect(plan.ratings).toEqual([]);
    expect(plan.unchanged).toEqual({ wines: 2, ratings: 2 });
  });

  it('replace keeps exactly the file and reports what will be deleted', () => {
    const backup = buildBackup([wine('w9')], []);
    const plan = planImport(backup, current, 'replace');
    expect(plan.wines).toEqual(backup.wines);
    expect(plan.ratings).toEqual([]);
    expect(plan.removed).toEqual({ wines: 2, ratings: 2 });
    expect(plan.added).toEqual({ wines: 1, ratings: 0 });
  });
});

describe('isBackupDue', () => {
  const now = new Date('2025-06-30T12:00:00.000Z');

  it('is never due with no data', () => {
    expect(isBackupDue(undefined, undefined, now)).toBe(false);
    expect(isBackupDue('2020-01-01T00:00:00.000Z', undefined, now)).toBe(false);
  });

  it('is due when the last export is more than 30 days old', () => {
    expect(isBackupDue('2025-05-30T11:00:00.000Z', '2024-01-01T00:00:00.000Z', now)).toBe(true);
    expect(isBackupDue('2025-05-31T13:00:00.000Z', '2024-01-01T00:00:00.000Z', now)).toBe(false);
    expect(isBackupDue('2025-06-29T00:00:00.000Z', '2024-01-01T00:00:00.000Z', now)).toBe(false);
  });

  it('with no export yet, waits until the oldest record is 30 days old', () => {
    expect(isBackupDue(undefined, '2025-06-20T00:00:00.000Z', now)).toBe(false);
    expect(isBackupDue(undefined, '2025-05-01T00:00:00.000Z', now)).toBe(true);
  });

  it('is due if the stored date is unreadable', () => {
    expect(isBackupDue('garbage', '2025-06-20T00:00:00.000Z', now)).toBe(true);
  });
});
