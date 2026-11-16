import { readFile, writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  expectNoSeriousA11yIssues,
  SAMPLE_RATINGS,
  SAMPLE_WINES,
  seed,
  trackConsole,
} from './helpers';

test.describe('backup', () => {
  // No arrows in this title: it becomes the folder of the downloaded file, and the
  // browser silently refuses to attach a file from a path containing one.
  test('export, clear data, import: everything is back', async ({ page }, testInfo) => {
    const messages = trackConsole(page);
    await seed(page, SAMPLE_WINES, SAMPLE_RATINGS);
    await page.goto('/#/backup');
    await expect(page.getByRole('heading', { level: 1, name: 'Backup and restore' })).toBeVisible();
    await expectNoSeriousA11yIssues(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^decant-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const path = testInfo.outputPath('backup.json');
    await download.saveAs(path);
    await expect(page.getByText(/with 4 wines and 5 tastings\./)).toBeVisible();
    await expect(page.getByText(/^Last backup: /)).toBeVisible();

    const backup = JSON.parse(await readFile(path, 'utf8'));
    expect(backup).toMatchObject({ app: 'decant', formatVersion: 1 });
    expect(backup.wines).toHaveLength(4);
    expect(backup.ratings).toHaveLength(5);

    // Clear everything, as if on a new device.
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('decant');
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
    );
    await page.reload();
    await page.getByRole('link', { name: 'Decant, home' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('link', { name: 'Backup and restore' }).click();
    await expect(page.getByText('No backup has been made on this device yet.')).toBeVisible();
    await page.getByLabel('Backup file').setInputFiles(path);
    await expect(page.getByText('4 wines and 5 tastings', { exact: true })).toBeVisible();
    await expect(page.getByText(/Merge will add 4 wines and 5 tastings/)).toBeVisible();
    await expectNoSeriousA11yIssues(page);
    await page.getByRole('button', { name: 'Import' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Merge this backup?' });
    await expectNoSeriousA11yIssues(page);
    await dialog.getByRole('button', { name: 'Merge' }).click();
    await expect(page.getByText(/Import complete\. Added 4 wines and 5 tastings/)).toBeVisible();

    await page.goto('/#/');
    await expect(page.getByText('4 wines', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Barolo Monfortino/ }).click();
    await expect(page.getByText('Average of 2 tastings')).toBeVisible();
    await expect(page.getByText('Roses and tar.')).toBeVisible();
    await expect(page.getByText('Giacomo Conterno · Piedmont · Italy')).toBeVisible();
    // The storage library warns when the test deletes the database under the open app.
    expect(messages.filter((m) => !m.includes('wants to delete database'))).toEqual([]);
  });

  test('replace asks for confirmation and removes what is not in the file', async ({
    page,
  }, testInfo) => {
    await seed(page, SAMPLE_WINES, SAMPLE_RATINGS);
    const path = testInfo.outputPath('one-wine.json');
    const stamp = '2025-01-01T00:00:00.000Z';
    await writeFile(
      path,
      JSON.stringify({
        app: 'decant',
        formatVersion: 1,
        exportedAt: stamp,
        wines: [{ id: 'only', name: 'Only wine', createdAt: stamp, updatedAt: stamp }],
        ratings: [],
      }),
    );
    await page.goto('/#/backup');
    await page.getByLabel('Backup file').setInputFiles(path);
    await page.getByRole('radio', { name: /Replace/ }).check();
    await expect(page.getByText(/Replace will delete the 4 wines and 5 tastings/)).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Replace your cellar?' });
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Import' }).click();
    await dialog.getByRole('button', { name: 'Replace everything' }).click();
    await expect(page.getByText(/Import complete/)).toBeVisible();
    await page.goto('/#/');
    await expect(page.getByText('1 wine', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Only wine/ })).toBeVisible();
  });

  test('a corrupt file is rejected with a clear message and nothing changes', async ({
    page,
  }, testInfo) => {
    await seed(page, SAMPLE_WINES, SAMPLE_RATINGS);
    const corrupt = testInfo.outputPath('corrupt.json');
    await writeFile(corrupt, '{"app":"decant","formatVersion":1,"wines":[{"id":"w1","na');
    const wrong = testInfo.outputPath('wrong.json');
    await writeFile(
      wrong,
      JSON.stringify({
        app: 'decant',
        formatVersion: 1,
        exportedAt: '2025-01-01T00:00:00.000Z',
        wines: [{ id: 'w1', name: '', createdAt: 'x', updatedAt: 'x' }],
        ratings: [],
      }),
    );

    await page.goto('/#/backup');
    await page.getByLabel('Backup file').setInputFiles(corrupt);
    await expect(page.getByRole('alert')).toContainText('This file is not a Decant backup.');
    await expect(page.getByRole('alert')).toContainText('Nothing was changed.');
    await expect(page.getByRole('button', { name: 'Import' })).toHaveCount(0);
    await expectNoSeriousA11yIssues(page);

    await page.getByLabel('Backup file').setInputFiles(wrong);
    await expect(page.getByRole('alert')).toContainText('This backup is damaged');
    await expect(page.getByRole('button', { name: 'Import' })).toHaveCount(0);

    await page.goto('/#/');
    await expect(page.getByText('4 wines', { exact: true })).toBeVisible();
    await page.goto('/#/tastings');
    await expect(page.getByText('5 tastings', { exact: true })).toBeVisible();
  });
});

test.describe('offline and install', () => {
  test('works fully offline after the first load', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The service worker has stored the app and taken control of this page.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
      }
    });

    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Add your first wine' }).click();
    await page.getByLabel('Wine name').fill('Offline Riesling');
    await page.getByRole('radio', { name: '4 stars' }).check({ force: true });
    await page.getByRole('button', { name: 'Save to my cellar' }).click();
    await expect(page.getByRole('link', { name: /Offline Riesling/ })).toBeVisible();

    const tabs = page.getByRole('navigation', { name: 'Sections' }).filter({ visible: true });
    for (const name of ['Wineries', 'Regions', 'Countries', 'Tastings']) {
      await tabs.getByRole('link', { name, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    }
    await page.goto('/#/backup');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Backup and restore' })).toBeVisible();

    // Fonts and the logo came from the offline store too.
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    );
    expect(fonts.join(' ')).toContain('Crimson Text');
    const logoOk = await page
      .getByRole('link', { name: 'Decant, home' })
      .locator('img')
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(logoOk).toBe(true);

    await page.reload();
    await page.goto('/#/');
    await expect(page.getByRole('link', { name: /Offline Riesling/ })).toBeVisible();
  });

  test('is installable: manifest, icons and service worker are in place', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href ?? '', page.url()).toString();
    const manifest = await (await request.get(manifestUrl)).json();
    expect(manifest).toMatchObject({ name: 'Decant', display: 'standalone', start_url: '.' });
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icon of manifest.icons as { src: string }[]) {
      const response = await request.get(new URL(icon.src, manifestUrl).toString());
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
    const registered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.active?.scriptURL ?? '';
    });
    expect(registered).toMatch(/\/sw\.js$/);
  });

  test('the service worker also works from a sub-path', async ({ page, context }) => {
    await page.goto('http://localhost:4174/some/sub/path/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
      }
    });
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeVisible();
  });
});
