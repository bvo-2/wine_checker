import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as platform from '../app/platform';
import type { Repositories } from '../data/repositories';
import { createTestRepositories } from '../data/testing';
import { buildBackup } from '../domain/backup';
import { renderApp } from '../test/render';

let repos: Repositories;
let download: MockInstance<typeof platform.downloadTextFile>;

beforeEach(async () => {
  sessionStorage.clear();
  download = vi.spyOn(platform, 'downloadTextFile').mockImplementation(() => {});
  repos = createTestRepositories().repos;
  await repos.wines.createWithRating({ name: 'Barolo' }, { stars: 5, tastedOn: '2025-03-01' });
  await repos.wines.createWithRating({ name: 'Chablis' }, { stars: 3, tastedOn: '2025-02-10' });
});

const jsonFile = (content: unknown, name = 'backup.json') =>
  new File([typeof content === 'string' ? content : JSON.stringify(content)], name, {
    type: 'application/json',
  });

async function snapshot() {
  return JSON.stringify([
    (await repos.wines.list()).sort((a, b) => a.id.localeCompare(b.id)),
    (await repos.ratings.list()).sort((a, b) => a.id.localeCompare(b.id)),
  ]);
}

describe('Backup: export', () => {
  it('downloads a versioned JSON file with everything and records the date', async () => {
    renderApp('/backup', repos);
    expect(
      await screen.findByText('No backup has been made on this device yet.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Export backup' }));

    expect(
      await screen.findByText(
        /Saved decant-backup-\d{4}-\d{2}-\d{2}\.json with 2 wines and 2 tastings\./,
      ),
    ).toBeInTheDocument();
    expect(download).toHaveBeenCalledOnce();
    const [fileName, text] = download.mock.calls[0] ?? [];
    expect(fileName).toMatch(/^decant-backup-.*\.json$/);
    const data = JSON.parse(text ?? '') as {
      app: string;
      formatVersion: number;
      wines: unknown[];
      ratings: unknown[];
    };
    expect(data).toMatchObject({ app: 'decant', formatVersion: 1 });
    expect(data.wines).toHaveLength(2);
    expect(data.ratings).toHaveLength(2);
    expect(await repos.meta.get('lastExportAt')).toBeTruthy();
    expect(await screen.findByText(/^Last backup: /)).toBeInTheDocument();
  });
});

describe('Backup: import', () => {
  it('shows a summary, then merges after confirmation', async () => {
    const file = await repos.backup.exportAll();
    const [first] = await repos.wines.list();
    if (first) await repos.wines.remove(first.id);

    renderApp('/backup', repos);
    await userEvent.upload(await screen.findByLabelText('Backup file'), jsonFile(file));
    expect(await screen.findByText('2 wines and 2 tastings')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Merge/ })).toBeChecked();
    expect(
      await screen.findByText(
        /Merge will add 1 wine and 1 tasting and update 0 wines and 0 tastings/,
      ),
    ).toBeInTheDocument();
    expect(await repos.wines.list()).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Merge this backup?' });
    expect(await repos.wines.list()).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Merge' }));

    expect(
      await screen.findByText(/Import complete\. Added 1 wine and 1 tasting/),
    ).toBeInTheDocument();
    expect(await repos.wines.list()).toHaveLength(2);
    expect(await repos.ratings.list()).toHaveLength(2);
  });

  it('replaces everything only after a destructive confirmation', async () => {
    const stamp = '2025-01-01T00:00:00.000Z';
    const other = buildBackup(
      [{ id: 'x', name: 'Only this', createdAt: stamp, updatedAt: stamp }],
      [],
    );
    renderApp('/backup', repos);
    await userEvent.upload(await screen.findByLabelText('Backup file'), jsonFile(other));
    await userEvent.click(await screen.findByRole('radio', { name: /Replace/ }));
    expect(
      await screen.findByText(
        /Replace will delete the 2 wines and 2 tastings stored on this device and keep only the 1 wine and 0 tastings/,
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Replace your cellar?' });
    expect(dialog).toHaveTextContent('This cannot be undone.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await repos.wines.list()).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Replace everything' }),
    );
    expect(
      await screen.findByText(/Import complete\. Your cellar now holds the 1 wine and 0 tastings/),
    ).toBeInTheDocument();
    expect((await repos.wines.list()).map((w) => w.name)).toEqual(['Only this']);
    expect(await repos.ratings.list()).toEqual([]);
  });

  it.each([
    ['a corrupt file', '{"app":"decant","wines":[', /not a Decant backup.*Nothing was changed\./],
    ['some other JSON', { hello: 'world' }, /not a Decant backup\. Nothing was changed\./],
    [
      'a newer format',
      { app: 'decant', formatVersion: 99 },
      /newer version of Decant.*Nothing was changed\./,
    ],
    [
      'invalid records',
      {
        app: 'decant',
        formatVersion: 1,
        exportedAt: '2025-01-01T00:00:00Z',
        wines: [{ id: 'a' }],
        ratings: [],
      },
      /damaged.*Nothing was changed\./,
    ],
  ])('rejects %s with a clear message and changes nothing', async (_label, content, message) => {
    const before = await snapshot();
    renderApp('/backup', repos);
    await userEvent.upload(await screen.findByLabelText('Backup file'), jsonFile(content));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
    expect(await snapshot()).toBe(before);
  });
});

describe('backup reminder', () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  it('is hidden when the data is recent', async () => {
    renderApp('/', repos);
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    await waitFor(() => expect(screen.queryByLabelText('Backup reminder')).not.toBeInTheDocument());
  });

  it('appears when the last export is over 30 days old and can be dismissed', async () => {
    await repos.meta.set('lastExportAt', daysAgo(31));
    renderApp('/', repos);
    const reminder = await screen.findByLabelText('Backup reminder');
    expect(reminder).toHaveTextContent('Your last backup is more than 30 days old.');
    expect(within(reminder).getByRole('link', { name: 'Back up now' })).toHaveAttribute(
      'href',
      '/backup',
    );
    await userEvent.click(within(reminder).getByRole('button', { name: 'Not now' }));
    expect(screen.queryByLabelText('Backup reminder')).not.toBeInTheDocument();
  });

  it('goes away after exporting', async () => {
    await repos.meta.set('lastExportAt', daysAgo(45));
    renderApp('/', repos);
    await userEvent.click(
      within(await screen.findByLabelText('Backup reminder')).getByRole('link', {
        name: 'Back up now',
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Export backup' }));
    await screen.findByText(/^Saved decant-backup/);
    await userEvent.click(screen.getByRole('link', { name: 'Decant, home' }));
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    await waitFor(() => expect(screen.queryByLabelText('Backup reminder')).not.toBeInTheDocument());
  });

  it('stays hidden for 29 days', async () => {
    await repos.meta.set('lastExportAt', daysAgo(29));
    renderApp('/', repos);
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    await waitFor(() => expect(screen.queryByLabelText('Backup reminder')).not.toBeInTheDocument());
  });
});
