import { expect, test } from '@playwright/test';
import {
  expectNoSeriousA11yIssues,
  openTab,
  SAMPLE_RATINGS,
  SAMPLE_WINES,
  seed,
  trackConsole,
} from './helpers';

test.describe('browse by winery, region, country and tastings', () => {
  test('every tab shows grouped data and opens a filtered cellar view', async ({ page }) => {
    const messages = trackConsole(page);
    await seed(page, SAMPLE_WINES, SAMPLE_RATINGS);
    const main = page.getByRole('main');

    // Wineries
    await openTab(page, 'Wineries');
    await expect(page.getByRole('heading', { level: 1, name: 'Wineries' })).toBeVisible();
    await expect(main.getByRole('listitem')).toHaveText([
      /Giacomo Conterno1 wine · 2 tastings.*4\.5/,
      /Pazo Señorans1 wine · 1 tasting.*3\.0/,
      /Raveneau1 wine · 1 tasting.*4\.0/,
      /Unknown1 wine · 1 tasting.*2\.0/,
    ]);
    await expectNoSeriousA11yIssues(page);
    await page.getByLabel('Sort by').selectOption('Highest rated');
    await expect(main.getByRole('listitem').first()).toContainText('Giacomo Conterno');
    await expect(main.getByRole('listitem').nth(1)).toContainText('Raveneau');
    await main.getByRole('link', { name: /Giacomo Conterno/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Giacomo Conterno' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 3 })).toHaveText(['Barolo Monfortino']);
    await expectNoSeriousA11yIssues(page);
    await main.getByRole('link', { name: 'Wineries' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Wineries' })).toBeVisible();

    // Regions
    await openTab(page, 'Regions');
    await expect(main.getByRole('listitem')).toHaveText([
      /Burgundy/,
      /Piedmont/,
      /Rías Baixas/,
      /Unknown/,
    ]);
    await expectNoSeriousA11yIssues(page);
    await main.getByRole('link', { name: /Unknown/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Unknown region' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 3 })).toHaveText(['House red']);

    // Countries
    await openTab(page, 'Countries');
    await expect(main.getByRole('listitem')).toHaveText([/France/, /Italy/, /Spain/, /Unknown/]);
    await expectNoSeriousA11yIssues(page);
    await main.getByRole('link', { name: /France/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'France' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 3 })).toHaveText(['Chablis Les Clos']);

    // Tastings
    await openTab(page, 'Tastings');
    await expect(page.getByRole('heading', { level: 1, name: 'Tastings' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      'June 2025',
      'March 2025',
      'February 2025',
      'November 2024',
    ]);
    await expect(
      page.getByRole('region', { name: 'June 2025' }).getByRole('heading', { level: 3 }),
    ).toHaveText(['Chablis Les Clos 2019', 'House red']);
    await expect(page.getByRole('region', { name: 'June 2025' })).toContainText('10 June 2025');
    await expectNoSeriousA11yIssues(page);
    await page.getByRole('region', { name: 'March 2025' }).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Barolo Monfortino' })).toBeVisible();
    expect(messages).toEqual([]);
  });

  test('every tab has an empty state', async ({ page }) => {
    for (const [path, title] of [
      ['wineries', 'No wineries yet'],
      ['regions', 'No regions yet'],
      ['countries', 'No countries yet'],
      ['tastings', 'No tastings yet'],
    ] as const) {
      await page.goto(`/#/${path}`);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expectNoSeriousA11yIssues(page);
    }
  });
});
