import { beforeEach, describe, expect, it } from 'vitest';
import { parseBackup } from '../domain/backup';
import type { DecantDb } from './db';
import { createRepositories, type Repositories } from './repositories';
import { createTestDb } from './testing';

let db: DecantDb;
let repos: Repositories;

beforeEach(async () => {
  db = createTestDb();
  repos = createRepositories(db);
  const a = await repos.wines.createWithRating(
    { name: 'Barolo', producer: 'Conterno', vintage: 2015, grapes: ['Nebbiolo'] },
    { stars: 5, tastedOn: '2025-03-01', note: 'Superb' },
  );
  await repos.ratings.create(a.wine.id, { stars: 4, tastedOn: '2025-03-20' });
  await repos.wines.createWithRating({ name: 'Chablis' }, { stars: 3, tastedOn: '2025-02-10' });
});

async function snapshot(r: Repositories) {
  const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
  return { wines: (await r.wines.list()).sort(byId), ratings: (await r.ratings.list()).sort(byId) };
}

describe('backup export and import', () => {
  it('export → clear → import brings everything back exactly', async () => {
    const before = await snapshot(repos);
    const file = JSON.stringify(await repos.backup.exportAll());

    const fresh = createRepositories(createTestDb());
    const parsed = parseBackup(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const plan = await fresh.backup.importAll(parsed.data, 'replace');
    expect(plan.added).toEqual({ wines: 2, ratings: 3 });
    expect(await snapshot(fresh)).toEqual(before);
  });

  it('merge keeps what is stored and adds what is missing', async () => {
    const file = await repos.backup.exportAll();
    const [first] = await repos.wines.list();
    if (first) await repos.wines.remove(first.id);
    const extra = await repos.wines.createWithRating(
      { name: 'New since backup' },
      { stars: 2, tastedOn: '2025-04-01' },
    );

    await repos.backup.importAll(file, 'merge');
    const after = await snapshot(repos);
    expect(after.wines).toHaveLength(3);
    expect(after.ratings).toHaveLength(4);
    expect(after.wines.some((w) => w.id === extra.wine.id)).toBe(true);
  });

  it('merge does not overwrite a record edited after the backup was made', async () => {
    const file = await repos.backup.exportAll();
    const [first] = await repos.wines.list();
    if (!first) throw new Error('seed failed');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repos.wines.update(first.id, { name: 'Edited later' });
    const plan = await repos.backup.importAll(file, 'merge');
    expect(plan.updated.wines).toBe(0);
    expect((await repos.wines.get(first.id))?.name).toBe('Edited later');
  });

  it('replace removes records that are not in the file', async () => {
    const file = await repos.backup.exportAll();
    await repos.wines.createWithRating(
      { name: 'Not in backup' },
      { stars: 1, tastedOn: '2025-04-01' },
    );
    const plan = await repos.backup.importAll(file, 'replace');
    expect(plan.removed).toEqual({ wines: 3, ratings: 4 });
    expect((await repos.wines.list()).map((w) => w.name).sort()).toEqual(['Barolo', 'Chablis']);
    expect(await repos.ratings.list()).toHaveLength(3);
  });

  it('preview reports the plan and changes nothing', async () => {
    const file = await repos.backup.exportAll();
    const before = await snapshot(repos);
    const plan = await repos.backup.preview({ ...file, wines: [], ratings: [] }, 'replace');
    expect(plan.removed).toEqual({ wines: 2, ratings: 3 });
    expect(await snapshot(repos)).toEqual(before);
  });

  it('a failed import changes nothing', async () => {
    const file = await repos.backup.exportAll();
    const before = await snapshot(repos);
    db.ratings.hook('creating', () => {
      throw new Error('disk full');
    });
    const other = { ...file, ratings: file.ratings.map((r) => ({ ...r, id: `new-${r.id}` })) };
    await expect(repos.backup.importAll(other, 'replace')).rejects.toThrow();
    expect(await snapshot(repos)).toEqual(before);
  });
});

describe('MetaRepository', () => {
  it('stores and reads the last export date', async () => {
    expect(await repos.meta.get('lastExportAt')).toBeUndefined();
    await repos.meta.set('lastExportAt', '2025-01-01T00:00:00.000Z');
    await repos.meta.set('lastExportAt', '2025-02-01T00:00:00.000Z');
    expect(await repos.meta.get('lastExportAt')).toBe('2025-02-01T00:00:00.000Z');
  });
});
